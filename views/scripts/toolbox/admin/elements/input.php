<?php

if ($this->input($this->element['name'])->isEmpty())
{
    $this->input($this->element['name'])->setDataFromResource( $this->element['default'] );
}

?>

<?= $this->input($this->element['name'], array('width' => $this->element['width'], 'class' => 'toolbox-input')); ?>