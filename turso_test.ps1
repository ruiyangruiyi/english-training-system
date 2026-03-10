$token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzMwNzM0MzQsImlkIjoiMDE5Y2QzNjgtYTIwMS03Y2Q2LTkyYWYtMGYwMjM4NTUzYmE0IiwicmlkIjoiMmEwZTg1OWQtMWI5Yy00YmVjLThiYWMtZDIzMzUyYThjZGMxIn0.zku419nHvMThdOCnM05pyh6mo47WMz7xso15pKLORdEL9mg4TVX3pRC21Wtv2BPV8RhC-t99CpK5Vrqo5A-uBw"
$url = "https://english-training-ruiyangruiyi.aws-ap-northeast-1.turso.io/v2/pipeline"

$body = @{
  requests = @(
    @{ type = "execute"; stmt = @{ sql = "SELECT name FROM sqlite_master WHERE type='table'" } },
    @{ type = "close" }
  )
} | ConvertTo-Json -Depth 5

try {
  $result = Invoke-RestMethod -Uri $url -Method Post -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $body
  $result | ConvertTo-Json -Depth 10
} catch {
  Write-Host "Error: $_"
  Write-Host "Response: $($_.Exception.Response)"
}
