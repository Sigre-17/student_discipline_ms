<?php

declare(strict_types=1);

namespace App\Services;

use PDO;

final class Database
{
    public static function connect(array $config): PDO
    {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            $config['DB_HOST'] ?? '127.0.0.1',
            $config['DB_PORT'] ?? '5432',
            $config['DB_DATABASE'] ?? 'school_discipline_db',
        );

        return new PDO($dsn, $config['DB_USERNAME'] ?? 'postgres', $config['DB_PASSWORD'] ?? '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    public static function fromEnvironment(): PDO
    {
        $path = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';
        $config = file_exists($path) ? self::loadEnv($path) : $_ENV;

        return self::connect($config);
    }

    public static function loadEnv(string $path): array
    {
        $values = [];
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim($value, " \t\n\r\0\x0B\"");
        }

        return $values;
    }
}
