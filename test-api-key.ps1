# 测试 API Key 是否有效

$apiKey = "sk-wOAmGmUMNFVsosjkCm68Fg2wJE7ctTPZMx8q3EozUiT49zFi"
$baseUrl = "https://tbnx.plus7.plus/v1/chat/completions"

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

$body = @{
    model = "deepseek-chat"
    messages = @(
        @{
            role = "user"
            content = "hi"
        }
    )
    stream = $false
} | ConvertTo-Json

Write-Host "测试 API Key..." -ForegroundColor Cyan
Write-Host "URL: $baseUrl" -ForegroundColor Yellow
Write-Host "Authorization: Bearer $($apiKey.Substring(0, 10))..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ 成功！API Key 有效" -ForegroundColor Green
    Write-Host "响应状态: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ 失败！API Key 无效或其他错误" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP 状态码: $statusCode" -ForegroundColor Red
        
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody" -ForegroundColor Red
    }
}

