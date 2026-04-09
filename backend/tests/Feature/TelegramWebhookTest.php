<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramWebhookTest extends TestCase
{
    public function test_chatid_command_sends_topic_information_to_telegram(): void
    {
        config(['services.telegram.bot_token' => 'test-token']);

        Http::fake([
            'https://api.telegram.org/bottest-token/sendMessage' => Http::response([
                'ok' => true,
                'result' => ['message_id' => 1],
            ], 200),
        ]);

        $response = $this->postJson('/api/telegram/webhook', [
            'message' => [
                'message_id' => 99,
                'message_thread_id' => 123,
                'text' => '/chatid',
                'chat' => [
                    'id' => -1001234567890,
                    'title' => 'CMMS Уведомления',
                    'type' => 'supergroup',
                ],
            ],
        ]);

        $response->assertOk()->assertJson([
            'status' => 'ok',
        ]);

        Http::assertSent(function ($request) {
            $data = $request->data();

            return $request->url() === 'https://api.telegram.org/bottest-token/sendMessage'
                && $data['chat_id'] === -1001234567890
                && $data['message_thread_id'] === 123
                && $data['parse_mode'] === 'HTML'
                && str_contains($data['text'], 'Chat ID: <code>-1001234567890</code>')
                && str_contains($data['text'], 'Topic ID: <code>123</code>')
                && str_contains($data['text'], 'Название чата: CMMS Уведомления')
                && str_contains($data['text'], 'Тип: supergroup');
        });
    }

    public function test_non_chatid_command_is_ignored(): void
    {
        config(['services.telegram.bot_token' => 'test-token']);

        Http::fake();

        $response = $this->postJson('/api/telegram/webhook', [
            'message' => [
                'text' => '/start',
                'chat' => [
                    'id' => -1001234567890,
                    'title' => 'CMMS Уведомления',
                    'type' => 'supergroup',
                ],
            ],
        ]);

        $response->assertOk()->assertJson([
            'status' => 'ignored',
        ]);

        Http::assertNothingSent();
    }
}