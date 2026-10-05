<?php

declare(strict_types=1);

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PDO;
use RuntimeException;
use Throwable;

final class AuthService
{
    public function __construct(
        private readonly PDO $database,
        private readonly string $jwtSecret,
        private readonly int $jwtTtlMinutes = 60,
    ) {
        if ($jwtSecret === '') {
            throw new RuntimeException('JWT_SECRET is required.');
        }
    }

    public function login(string $username, string $password): array
    {
        $statement = $this->database->prepare(
            'SELECT user_id, username, password_hash, full_name, role, linked_id, is_active
             FROM users WHERE username = :username LIMIT 1'
        );
        $statement->execute(['username' => $username]);
        $user = $statement->fetch();

        if (!$user || !$user['is_active'] || !password_verify($password, $user['password_hash'])) {
            throw new RuntimeException('Invalid username or password.');
        }

        $now = time();
        $payload = [
            'iss' => 'sdms-api',
            'iat' => $now,
            'exp' => $now + ($this->jwtTtlMinutes * 60),
            'sub' => (int) $user['user_id'],
            'username' => $user['username'],
            'role' => $user['role'],
        ];

        $audit = $this->database->prepare(
            "INSERT INTO audit_log (user_id, action, table_affected, record_id, details)
             VALUES (:user_id, 'LOGIN', 'users', :record_id, :details)"
        );
        $audit->execute([
            'user_id' => $user['user_id'],
            'record_id' => (string) $user['user_id'],
            'details' => 'Successful login.',
        ]);

        $update = $this->database->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = :user_id');
        $update->execute(['user_id' => $user['user_id']]);

        unset($user['password_hash']);

        return [
            'token' => JWT::encode($payload, $this->jwtSecret, 'HS256'),
            'user' => $user,
        ];
    }

    public function validateToken(string $token): ?array
    {
        try {
            $decoded = (array) JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return $decoded;
        } catch (Throwable) {
            return null;
        }
    }

    public function logAudit(?int $userId, string $action, string $table, ?string $recordId, string $details): void
    {
        try {
            $stmt = $this->database->prepare(
                'INSERT INTO audit_log (user_id, action, table_affected, record_id, details)
                 VALUES (:user_id, :action, :table, :record_id, :details)'
            );
            $stmt->execute([
                'user_id' => $userId,
                'action' => $action,
                'table' => $table,
                'record_id' => $recordId,
                'details' => $details,
            ]);
        } catch (Throwable) {
            // Audit fail-safe
        }
    }
}
