<?php

require_once('../vendor/autoload.php');

$object = new MyApp\MyClass();
$result = $object->method1(1, 1);
$env = $_ENV['APP_ENV'] ?? '';

echo <<<HTML
<h1>Hello, Result is {$result}</h1>
<strong>Env: {$env}</strong>
HTML
    ;
