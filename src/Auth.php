<?php
// Authentification du backoffice.
// - mot de passe haché (password_hash / password_verify), jamais stocké en clair
// - blocage après plusieurs échecs (protection contre la force brute)
// - jeton CSRF sur tous les formulaires
// - expiration de session après inactivité

declare(strict_types=1);

final class Auth
{
    public function __construct(private JsonStore $store, private array $config)
    {
    }

    public function check(): bool
    {
        if (empty($_SESSION['admin'])) {
            return false;
        }
        if (time() - ($_SESSION['last_activity'] ?? 0) > $this->config['session_lifetime']) {
            $this->logout();
            return false;
        }
        $_SESSION['last_activity'] = time();
        return true;
    }

    // Renvoie null si la connexion réussit, sinon un message d'erreur.
    public function login(string $username, string $password): ?string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
        $attempts = $this->store->read('login_attempts');
        $entry = $attempts[$ip] ?? ['count' => 0, 'since' => time()];

        if (time() - $entry['since'] > $this->config['login_lock_seconds']) {
            $entry = ['count' => 0, 'since' => time()];
        }
        if ($entry['count'] >= $this->config['login_max_attempts']) {
            return 'Trop de tentatives. Réessayez dans quelques minutes.';
        }

        $admin = $this->store->read('admin', null);
        $valid = $admin
            && hash_equals($admin['username'], $username)
            && password_verify($password, $admin['password_hash']);

        if (!$valid) {
            $entry['count']++;
            $attempts[$ip] = $entry;
            $this->store->write('login_attempts', $attempts);
            return 'Identifiant ou mot de passe incorrect.';
        }

        unset($attempts[$ip]);
        $this->store->write('login_attempts', $attempts);

        // Nouvel identifiant de session après connexion (évite la fixation de session).
        session_regenerate_id(true);
        $_SESSION['admin'] = $admin['username'];
        $_SESSION['last_activity'] = time();
        return null;
    }

    public function logout(): void
    {
        $_SESSION = [];
        session_regenerate_id(true);
    }

    public static function csrfToken(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    public static function checkCsrf(): bool
    {
        return isset($_POST['csrf'], $_SESSION['csrf']) && hash_equals($_SESSION['csrf'], (string) $_POST['csrf']);
    }
}
