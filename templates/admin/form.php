<p class="breadcrumb"><a href="<?= e($back) ?>">← Retour</a></p>
<h1><?= e($title) ?></h1>

<?php if (!empty($error)): ?>
    <p class="alert error" role="alert"><?= e($error) ?></p>
<?php endif; ?>
<?php if (!empty($saved)): ?>
    <p class="alert success" role="status">Modifications enregistrées.</p>
<?php endif; ?>

<form method="post" action="<?= e($action) ?>" class="admin-form">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <?php foreach ($fields as $name => $field): ?>
        <?php
        $value = $item[$name] ?? '';
        if (is_array($value)) {
            $value = implode(', ', $value);
        }
        $id = 'f-' . $name;
        ?>
        <p>
            <label for="<?= e($id) ?>"><?= e($field['label']) ?><?= !empty($field['required']) ? ' *' : '' ?></label>
            <?php if ($field['type'] === 'textarea'): ?>
                <textarea id="<?= e($id) ?>" name="<?= e($name) ?>" rows="3"><?= e($value) ?></textarea>
            <?php elseif ($field['type'] === 'markdown'): ?>
                <textarea id="<?= e($id) ?>" name="<?= e($name) ?>" rows="16" class="markdown"><?= e($value) ?></textarea>
                <small>Mise en forme : ## Titre, - liste, **gras**, `code`, [lien](https://…), ``` pour un bloc de code.</small>
            <?php elseif ($field['type'] === 'select'): ?>
                <select id="<?= e($id) ?>" name="<?= e($name) ?>">
                    <?php foreach ($field['options'] as $option): ?>
                        <option<?= $option === $value ? ' selected' : '' ?>><?= e($option) ?></option>
                    <?php endforeach; ?>
                </select>
            <?php else: ?>
                <input id="<?= e($id) ?>" name="<?= e($name) ?>" type="<?= $field['type'] === 'date' ? 'date' : 'text' ?>" value="<?= e($value) ?>"<?= !empty($field['required']) ? ' required' : '' ?>>
            <?php endif; ?>
            <?php if (!empty($field['help'])): ?>
                <small><?= e($field['help']) ?></small>
            <?php endif; ?>
        </p>
    <?php endforeach; ?>
    <button type="submit">Enregistrer</button>
</form>
