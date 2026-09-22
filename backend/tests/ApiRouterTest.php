<?php

declare(strict_types=1);

namespace Tests;

use App\Http\ApiRouter;
use App\Services\AuthService;
use App\Services\Database;
use PHPUnit\Framework\TestCase;

final class ApiRouterTest extends TestCase
{
    private ApiRouter $router;

    protected function setUp(): void
    {
        $config = Database::loadEnv(dirname(__DIR__) . '/.env');
        $database = Database::connect($config);
        $this->router = new ApiRouter($database, new AuthService($database, $config['JWT_SECRET'], 60));
    }

    public function testTablesEndpointShowsSchemaTables(): void
    {
        $result = $this->router->handle('GET', '/api/tables');

        self::assertSame(200, $result['status']);
        self::assertContains('users', $result['body']['tables']);
        self::assertContains('incidents', $result['body']['tables']);
        self::assertCount(17, $result['body']['tables']);
    }

    public function testSeedStatusShowsDemoRows(): void
    {
        $result = $this->router->handle('GET', '/api/seed-status');

        self::assertSame(200, $result['status']);
        self::assertSame(1, $result['body']['counts']['users']);
        self::assertSame(1, $result['body']['counts']['students']);
    }
}
