# 测试后端网关连通性（不在前端或脚本中保存上游 API Key）

$backendBaseUrl = "http://localhost:3001"
$internalToken = $env:INTERNAL_API_TOKEN

$headers = @{
    'Content-Type' = 'application/json'
}

if ($internalToken) {
    $headers['x-internal-token'] = $internalToken
}

$body = @{
    model = "free:Qwen3-30B-A3B"
    messages = @(
        @{
            role = "user"
            content = "hi"
        }
    )
    stream = $false
} | ConvertTo-Json

Write-Host "测试后端网关..." -ForegroundColor Cyan
Write-Host "Health URL: $backendBaseUrl/health" -ForegroundColor Yellow
Write-Host "Chat URL: $backendBaseUrl/api/chat" -ForegroundColor Yellow
Write-Host ""

try {
    $health = Invoke-WebRequest -Uri "$backendBaseUrl/health" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✅ 健康检查通过: $($health.StatusCode)" -ForegroundColor Green

    $response = Invoke-WebRequest -Uri "$backendBaseUrl/api/chat" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ Chat 网关调用成功: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ 调用失败" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP 状态码: $statusCode" -ForegroundColor Red

        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody" -ForegroundColor Red
    }
}
