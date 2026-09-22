<?php

declare(strict_types=1);

namespace Tests;

use App\Services\Database;
use PHPUnit\Framework\TestCase;

final class DatabaseHealthTest extends TestCase
{
    public function testDatabaseHasAllSeventeenExpectedTables(): void
    {
        $config = Database::loadEnv(dirname(__DIR__) . '/.env');
        $database = Database::connect($config);
        $tables = $database->query(
            "SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' ORDER BY table_name"
        )->fetchAll(\PDO::FETCH_COLUMN);

        self::assertCount(17, $tables);
        self::assertContains('audit_log', $tables);
        self::assertContains('behaviour_summary', $tables);
    }
}
