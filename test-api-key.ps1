# 测试 API Key 是否有效

param(
    [string]$ApiKey = $env:OPENAI_API_KEY,
    [string]$BaseUrl = $env:OPENAI_API_BASE_URL,
    [string]$Model = $env:OPENAI_DEFAULT_MODEL
)

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    Write-Host "未提供 API Key。请先设置 OPENAI_API_KEY 或使用 -ApiKey 传入。" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = "https://api-vip.codex-for.me/v1"
}

if ([string]::IsNullOrWhiteSpace($Model)) {
    $Model = "gpt-5.3-codex"
}

$baseUrl = $BaseUrl.TrimEnd('/')
if ($baseUrl -notmatch '/responses$') {
    $baseUrl = "$baseUrl/responses"
}

$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

$body = @{
    model = $Model
    input = @(
        @{
            role = "user"
            content = "hi"
        }
    )
    stream = $false
} | ConvertTo-Json -Depth 5

Write-Host "测试 API Key..." -ForegroundColor Cyan
Write-Host "URL: $baseUrl" -ForegroundColor Yellow
Write-Host "Model: $Model" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "成功，API Key 可用" -ForegroundColor Green
    Write-Host "响应状态: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 8
} catch {
    Write-Host "失败，API Key 无效或请求异常" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP 状态码: $statusCode" -ForegroundColor Red

        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "响应内容: $responseBody" -ForegroundColor Red
    }
}
