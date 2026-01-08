# 修复文件编码问题的PowerShell脚本
# 将所有文本文件转换为UTF-8编码（带BOM）

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "开始修复文件编码..." -ForegroundColor Green

# 需要修复的文件列表
$filesToFix = @(
    "locales\zh.ts",
    "locales\en.ts",
    "locales\ja.ts",
    "locales\ko.ts",
    "测试方式说明.md",
    "README.md",
    "app.json",
    "package.json"
)

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        Write-Host "处理文件: $file" -ForegroundColor Yellow
        
        try {
            # 尝试多种编码读取文件
            $content = $null
            $encodings = @(
                [System.Text.Encoding]::UTF8,
                [System.Text.Encoding]::Default,
                [System.Text.Encoding]::GetEncoding("GB2312"),
                [System.Text.Encoding]::GetEncoding("GBK")
            )
            
            foreach ($encoding in $encodings) {
                try {
                    $content = [System.IO.File]::ReadAllText($file, $encoding)
                    if ($content -and $content -notmatch '[\x00-\x08\x0B\x0C\x0E-\x1F]') {
                        Write-Host "  使用 $($encoding.EncodingName) 编码成功读取" -ForegroundColor Cyan
                        break
                    }
                } catch {
                    continue
                }
            }
            
            if ($content) {
                # 保存为UTF-8（带BOM）
                $utf8WithBom = New-Object System.Text.UTF8Encoding $true
                [System.IO.File]::WriteAllText($file, $content, $utf8WithBom)
                Write-Host "  ✓ 已转换为 UTF-8 (BOM)" -ForegroundColor Green
            } else {
                Write-Host "  ✗ 无法读取文件" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ✗ 处理失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "文件不存在: $file" -ForegroundColor Gray
    }
}

Write-Host "`n编码修复完成！" -ForegroundColor Green
Write-Host "建议重新启动开发服务器以应用更改。" -ForegroundColor Yellow




