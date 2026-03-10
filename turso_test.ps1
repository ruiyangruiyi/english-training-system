$token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzMxMTE4NDIsImlkIjoiMDE5Y2Q1YjMtMmUwMS03OWFiLWE5M2EtNDJkMTljNjJmZDg4IiwicmlkIjoiMWE0MGE2YjItZWU5NC00NmVlLWIzMzEtMTY5MjcxMWM5MGI0In0.yjEQh15oQhe3OvVLI0BBsvxRHwUDTeniYk-0wM0EER50NMesz7I4OBvk_H6jpL1G1GBBuCElZzXSEXizFl0tDg"
$url = "https://english-training-1-ruiyangruiyi.aws-us-east-2.turso.io/v2/pipeline"

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
}
