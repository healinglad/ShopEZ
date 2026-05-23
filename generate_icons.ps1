# generate_icons.ps1
# Automates the resizing and replacement of Android mipmap launcher icons

Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\91783\.gemini\antigravity\brain\f98b15f4-4d84-4817-b14e-fbf91ac9c9b0\shopez_app_icon_1779558429118.png"
$resBaseDir = "B:\ShopEZ\android\app\src\main\res"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source icon not found at: $sourcePath"
    exit 1
}

# Define target directories and their icon sizes (width/height in pixels)
$densities = @(
    @{ Name = "mipmap-mdpi"; Size = 48 },
    @{ Name = "mipmap-hdpi"; Size = 72 },
    @{ Name = "mipmap-xhdpi"; Size = 96 },
    @{ Name = "mipmap-xxhdpi"; Size = 144 },
    @{ Name = "mipmap-xxxhdpi"; Size = 192 }
)

function Resize-Png {
    param (
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Size
    )
    
    $src = [System.Drawing.Image]::FromFile($InputPath)
    $dest = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    
    # Configure high-quality scaling settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($src, 0, 0, $Size, $Size)
    
    $src.Dispose()
    $g.Dispose()
    
    # Save the output PNG
    $dest.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    
    Write-Host "Generated: $OutputPath"
}

foreach ($d in $densities) {
    $dirPath = Join-Path $resBaseDir $d.Name
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Force -Path $dirPath | Out-Null
    }
    
    $size = $d.Size
    
    # Output file paths
    $launcherPath = Join-Path $dirPath "ic_launcher.png"
    $roundPath = Join-Path $dirPath "ic_launcher_round.png"
    $foregroundPath = Join-Path $dirPath "ic_launcher_foreground.png"
    
    # Resize and write files
    Resize-Png -InputPath $sourcePath -OutputPath $launcherPath -Size $size
    Resize-Png -InputPath $sourcePath -OutputPath $roundPath -Size $size
    Resize-Png -InputPath $sourcePath -OutputPath $foregroundPath -Size $size
}

Write-Host "Application icons successfully generated and deployed! 🚀"
