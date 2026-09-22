<?php

declare(strict_types=1);

namespace Tests;

use App\Services\AuthService;
use App\Services\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PHPUnit\Framework\TestCase;

final class AuthServiceTest extends TestCase
{
    public function testGraceCanLogInWithSeedPassword(): void
    {
        $config = Database::loadEnv(dirname(__DIR__) . '/.env');
        $database = Database::connect($config);
        $service = new AuthService($database, $config['JWT_SECRET'], 60);

        $result = $service->login('adong.grace', 'Grace@123');
        $claims = (array) JWT::decode($result['token'], new Key($config['JWT_SECRET'], 'HS256'));

        self::assertSame('adong.grace', $result['user']['username']);
        self::assertSame('Head Teacher', $result['user']['role']);
        self::assertSame(1, $claims['sub']);
    }

    public function testWrongPasswordIsRejected(): void
    {
        $config = Database::loadEnv(dirname(__DIR__) . '/.env');
        $database = Database::connect($config);
        $service = new AuthService($database, $config['JWT_SECRET'], 60);

        $this->expectExceptionMessage('Invalid username or password.');
        $service->login('adong.grace', 'wrong-password');
    }
}
