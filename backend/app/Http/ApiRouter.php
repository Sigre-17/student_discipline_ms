<?php

declare(strict_types=1);

namespace App\Http;

use App\Services\AuthService;
use PDO;
use Throwable;

final class ApiRouter
{
    public function __construct(
        private readonly PDO $database,
        private readonly AuthService $auth,
    ) {
    }

    public function handle(string $method, string $path, array $input = []): array
    {
        try {
            if ($method === 'POST' && $path === '/api/auth/login') {
                if (!isset($input['username'], $input['password'])) {
                    return $this->response(['message' => 'username and password are required'], 422);
                }

                return $this->response($this->auth->login($input['username'], $input['password']));
            }

            if ($method === 'GET' && $path === '/api/tables') {
                return $this->response(['tables' => $this->tableNames()]);
            }

            if ($method === 'GET' && $path === '/api/seed-status') {
                return $this->response(['counts' => $this->seedCounts()]);
            }

            return $this->response(['message' => 'Route not found'], 404);
        } catch (Throwable $exception) {
            $status = $exception->getMessage() === 'Invalid username or password.' ? 401 : 500;
            return $this->response(['message' => $exception->getMessage()], $status);
        }
    }

    private function tableNames(): array
    {
        $query = $this->database->query(
            "SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' ORDER BY table_name"
        );

        return array_column($query->fetchAll(), 'table_name');
    }

    private function seedCounts(): array
    {
        $tables = ['terms', 'staff', 'classes', 'students', 'users', 'incidents', 'sanctions', 'audit_log'];
        $counts = [];
        foreach ($tables as $table) {
            $counts[$table] = (int) $this->database->query("SELECT COUNT(*) FROM \"$table\"")->fetchColumn();
        }

        return $counts;
    }

    private function response(array $body, int $status = 200): array
    {
        return ['status' => $status, 'body' => $body];
    }
}
