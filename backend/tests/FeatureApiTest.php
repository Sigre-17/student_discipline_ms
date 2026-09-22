<?php

declare(strict_types=1);

namespace Tests;

use App\Http\ApiRouter;
use App\Services\AuthService;
use App\Services\Database;
use PHPUnit\Framework\TestCase;

final class FeatureApiTest extends TestCase
{
    public function testLoginRouteReturnsUnauthorizedForUnknownUser(): void
    {
        $config = Database::loadEnv(dirname(__DIR__) . '/.env');
        $database = Database::connect($config);
        $router = new ApiRouter($database, new AuthService($database, $config['JWT_SECRET'], 60));

        $result = $router->handle('POST', '/api/auth/login', [
            'username' => 'unknown.user',
            'password' => 'Grace@123',
        ]);

        self::assertSame(401, $result['status']);
        self::assertSame('Invalid username or password.', $result['body']['message']);
    }
}
