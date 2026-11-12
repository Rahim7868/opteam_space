<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TechnicalLogController extends Controller
{
    private const VIEW_PERMISSION = 'consulter_logs_techniques';
    private const LEVELS = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];
    private const MAX_TAIL_BYTES = 1048576;

    public function index(Request $request): JsonResponse
    {
        abort_unless(
            $request->user()->hasPermission(self::VIEW_PERMISSION),
            403,
            'Permission refusée.'
        );

        $filters = $request->validate([
            'level' => ['nullable', Rule::in(self::LEVELS)],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $limit = (int) ($filters['limit'] ?? 50);
        [$path, $channel] = $this->resolveLogFile();

        if (!is_file($path)) {
            return response()->json([
                'data' => [],
                'meta' => ['limit' => $limit, 'has_more' => false, 'channel' => $channel],
            ]);
        }

        if (!is_readable($path)) {
            abort(503, 'Le fichier de journaux techniques n’est pas accessible.');
        }

        $handle = fopen($path, 'rb');
        if ($handle === false) {
            abort(503, 'Le fichier de journaux techniques n’a pas pu être ouvert.');
        }

        try {
            $stat = fstat($handle);
            if ($stat === false) {
                abort(500, 'Impossible de lire les informations du fichier de journaux.');
            }

            $offset = max(0, $stat['size'] - self::MAX_TAIL_BYTES);
            if ($offset > 0 && fseek($handle, $offset) !== 0) {
                abort(500, 'Impossible de parcourir le fichier de journaux.');
            }

            $contents = stream_get_contents($handle);
            if ($contents === false) {
                abort(500, 'Impossible de lire le fichier de journaux.');
            }
        } finally {
            fclose($handle);
        }

        if ($offset > 0) {
            $firstLineEnd = strpos($contents, "\n");
            $contents = $firstLineEnd === false ? '' : substr($contents, $firstLineEnd + 1);
        }

        preg_match_all(
            '/^\[(?<timestamp>[^\]\r\n]+)\]\s+\S+\.(?<level>EMERGENCY|ALERT|CRITICAL|ERROR|WARNING|NOTICE|INFO|DEBUG):\s?(?<message>[^\r\n]*)/m',
            $contents,
            $matches,
            PREG_SET_ORDER
        );

        $entries = [];
        foreach ($matches as $match) {
            $level = strtolower($match['level']);
            if (!empty($filters['level']) && $level !== $filters['level']) {
                continue;
            }

            $entries[] = [
                'timestamp' => $match['timestamp'],
                'level' => $level,
                'message' => $this->sanitizeMessage($match['message']),
            ];
        }

        $hasMore = count($entries) > $limit;
        $entries = array_reverse(array_slice($entries, -$limit));

        return response()->json([
            'data' => $entries,
            'meta' => [
                'limit' => $limit,
                'has_more' => $hasMore,
                'channel' => $channel,
            ],
        ]);
    }

    private function resolveLogFile(): array
    {
        $channelName = config('logging.default');
        $channel = config("logging.channels.{$channelName}");

        if (($channel['driver'] ?? null) === 'stack') {
            foreach ($channel['channels'] ?? [] as $stackChannelName) {
                $stackChannel = config("logging.channels.{$stackChannelName}");
                if (in_array($stackChannel['driver'] ?? null, ['single', 'daily'], true)) {
                    $channelName = $stackChannelName;
                    $channel = $stackChannel;
                    break;
                }
            }
        }

        $driver = $channel['driver'] ?? null;
        if (!in_array($driver, ['single', 'daily'], true) || empty($channel['path'])) {
            abort(503, 'Le canal de journaux configuré n’écrit pas dans un fichier consultable.');
        }

        $path = $channel['path'];
        if ($driver === 'daily') {
            $extension = pathinfo($path, PATHINFO_EXTENSION);
            $filename = pathinfo($path, PATHINFO_FILENAME)
                . '-'
                . now()->format($channel['date_format'] ?? 'Y-m-d');
            $path = dirname($path) . DIRECTORY_SEPARATOR . $filename
                . ($extension === '' ? '' : '.' . $extension);
        }

        return [$path, $driver];
    }

    private function sanitizeMessage(string $message): string
    {
        $message = preg_replace(
            '/\b(password|passwd|secret|token|api[_-]?key|authorization|cookie)\b(["\']?\s*[:=]\s*["\']?)[^\s,;}\]]+/i',
            '$1$2[masqué]',
            $message
        );
        if ($message === null) {
            abort(500, 'Impossible de filtrer un message de journal.');
        }

        $message = preg_replace('/\bBearer\s+\S+/i', 'Bearer [masqué]', $message);
        if ($message === null) {
            abort(500, 'Impossible de filtrer un message de journal.');
        }

        return substr($message, 0, 500);
    }
}
