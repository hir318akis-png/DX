// APIキーの情報を読み込む
import { GEMINI_API_KEY } from './config.js';
// @google/genai ライブラリを読み込む
import { GoogleGenAI } from 'https://cdn.jsdelivr.net/npm/@google/genai';


// DOMが完全に読み込まれた後に実行される (jQuery利用)
$(document).ready(function() {
    
    const $button = $('#generate-button');
    const $ingredientsInput = $('#ingredients');
    const $resultArea = $('#menu-suggestion');
    const $loadingMessage = $('#loading-message');

    // APIキーの確認とSDKのインスタンス化
    if (typeof GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === 'あなたの-Gemini-API-キー-を-ここに-入力') {
        $resultArea.text("エラー: config.js にAPIキーを設定してください。").css('color', 'red');
        $button.prop('disabled', true);
        return;
    }

    // @google/genai ライブラリを初期化
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const model = 'gemini-2.5-flash';

    // ボタンクリックイベントの処理
    $button.on('click', async function() {
        const ingredients = $ingredientsInput.val().trim();

        if (ingredients === "") {
            alert("食材を入力してください！");
            return;
        }

        // 状態をリセットし、ローディングメッセージを表示
        $resultArea.html('');
        $loadingMessage.removeClass('hidden');
        $button.prop('disabled', true).text('AIが考え中...');

        // Geminiに送るプロンプトを構築
        const prompt = `
            あなたは優秀な料理研究家AIです。
            以下の冷蔵庫にある食材をすべて、または一部を使って、調理時間15分以内で作れる簡単な料理のレシピを一つ提案してください。
            
            # 冷蔵庫の食材
            ${ingredients}
            
            # 提案形式（この形式を厳守してください）
            1. **料理名**：
            2. **必要な材料（分量込み）**：
            3. **調理ステップ（箇条書き）**：
            4. **一言コメント（簡単なアレンジやヒント）**：
            
            日本語で回答してください。
        `;
        
        try {
            // 🌟【SDK利用】SDKのメソッド generateContent を利用して呼び出す
            const response = await ai.models.generateContent({
                model: model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.7,
                },
            });

            // 提案テキストの抽出
            const suggestion = response.text;

            if (suggestion) {
                // 結果を表示 (改行をHTMLの<br>に変換して整形)
                $resultArea.html(suggestion.replace(/\n/g, '<br>')); 
            } else {
                $resultArea.text("献立の提案を取得できませんでした。別の食材で試してください。");
            }

        } catch (error) {
            console.error("Gemini API呼び出し中にエラーが発生しました:", error);
            $resultArea.text(`エラーが発生しました: ${error.message}`).css('color', 'red');
        } finally {
            // 処理が完了したら状態を元に戻す
            $loadingMessage.addClass('hidden');
            $button.prop('disabled', false).text('献立を提案する');
        }
    });
});