<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Http\ApiRouter;
use App\Services\AuthService;
use App\Services\Database;

$database = Database::fromEnvironment();
$config = Database::loadEnv(dirname(__DIR__) . '/.env');
$router = new ApiRouter(
    $database,
    new AuthService($database, $config['JWT_SECRET'] ?? '', (int) ($config['JWT_TTL'] ?? 60)),
);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$result = $router->handle($method, $path, $input);

http_response_code($result['status']);
header('Content-Type: application/json');
echo json_encode($result['body'], JSON_PRETTY_PRINT);
