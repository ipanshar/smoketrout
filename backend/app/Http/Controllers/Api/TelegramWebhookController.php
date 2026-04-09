<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function webhook(Request $request)
    {
        $botToken = (string) config('services.telegram.bot_token');

        if ($botToken === '') {
            Log::warning('Telegram webhook called without bot token configuration.');

            return response()->json([
                'message' => 'Telegram bot token is not configured.',
            ], 500);
        }

        $update = $request->all();
        $message = $update['message']
            ?? $update['edited_message']
            ?? $update['channel_post']
            ?? $update['edited_channel_post']
            ?? null;

        if (!is_array($message)) {
            return response()->json(['status' => 'ignored']);
        }

        $text = trim((string) ($message['text'] ?? ''));

        if (!$this->isChatIdCommand($text)) {
            return response()->json(['status' => 'ignored']);
        }

        $chat = $message['chat'] ?? [];
        $chatId = $chat['id'] ?? null;

        if ($chatId === null) {
            return response()->json(['status' => 'ignored']);
        }

        $topicId = $message['message_thread_id'] ?? null;
        $chatTitle = $chat['title'] ?? $chat['username'] ?? $chat['first_name'] ?? 'Без названия';
        $chatType = $chat['type'] ?? 'unknown';

        $responseText = $this->buildTopicInfoMessage(
            (string) $chatId,
            $topicId,
            (string) $chatTitle,
            (string) $chatType,
        );

        $payload = [
            'chat_id' => $chatId,
            'text' => $responseText,
            'parse_mode' => 'HTML',
        ];

        if (is_int($topicId) || ctype_digit((string) $topicId)) {
            $payload['message_thread_id'] = (int) $topicId;
        }

        /** @var Response $telegramResponse */
        $telegramResponse = Http::asForm()->post(
            sprintf('https://api.telegram.org/bot%s/sendMessage', $botToken),
            $payload,
        );

        if ($telegramResponse->failed()) {
            Log::warning('Telegram sendMessage request failed.', [
                'status' => $telegramResponse->status(),
                'body' => $telegramResponse->body(),
            ]);

            return response()->json(['status' => 'error'], 502);
        }

        return response()->json(['status' => 'ok']);
    }

    private function isChatIdCommand(string $text): bool
    {
        return preg_match('/^\/chatid(?:@\w+)?(?:\s|$)/u', $text) === 1;
    }

    private function buildTopicInfoMessage(string $chatId, mixed $topicId, string $chatTitle, string $chatType): string
    {
        $safeTitle = htmlspecialchars($chatTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $topicIdText = $topicId !== null && $topicId !== ''
            ? (string) $topicId
            : 'не определён';

        return implode("\n", [
            '📍 <b>Информация о теме:</b>',
            '',
            sprintf('🆔 Chat ID: <code>%s</code>', $chatId),
            sprintf('📌 Topic ID: <code>%s</code>', $topicIdText),
            sprintf('📛 Название чата: %s', $safeTitle),
            sprintf('📊 Тип: %s', $chatType),
        ]);
    }
}