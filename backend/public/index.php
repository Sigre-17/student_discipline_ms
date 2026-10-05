<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

use App\Http\ApiRouter;
use App\Services\AuthService;
use App\Services\Database;

$database = Database::fromEnvironment();
$config = Database::loadEnv(dirname(__DIR__) . '/.env');
$authService = new AuthService($database, $config['JWT_SECRET'] ?? '', (int) ($config['JWT_TTL'] ?? 60));
$router = new ApiRouter($database, $authService);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
}

$token = '';
if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = trim($matches[1]);
}

$result = $router->handle($method, $path, $input, $_GET, $token);

http_response_code($result['status']);
header('Content-Type: application/json');
echo json_encode($result['body'], JSON_PRETTY_PRINT);
