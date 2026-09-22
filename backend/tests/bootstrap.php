<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

if (!extension_loaded('pdo_pgsql')) {
    throw new RuntimeException('pdo_pgsql is required for integration tests.');
}
