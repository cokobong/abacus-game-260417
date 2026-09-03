Add-Type -AssemblyName System.Drawing

$sourceRoot = Join-Path $PSScriptRoot '..\src\assets\adventure\lava-valley'
$playerRoot = Join-Path $sourceRoot 'player'
$collectibleRoot = Join-Path $sourceRoot 'collectibles'

function Resize-Png([string]$source, [string]$destination, [int]$size) {
  $inputImage = [Drawing.Image]::FromFile($source)
  try {
    $outputImage = [Drawing.Bitmap]::new($size, $size, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [Drawing.Graphics]::FromImage($outputImage)
      try {
        $graphics.Clear([Drawing.Color]::Transparent)
        $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($inputImage, 0, 0, $size, $size)
      } finally { $graphics.Dispose() }
      $outputImage.Save($destination, [Drawing.Imaging.ImageFormat]::Png)
    } finally { $outputImage.Dispose() }
  } finally { $inputImage.Dispose() }
}

$playerFiles = @('carnotaurus_idle.png', 'carnotaurus_jump_up.png', 'carnotaurus_fall.png', 'carnotaurus_hurt.png', 'carnotaurus_victory.png')
foreach ($name in $playerFiles) {
  Resize-Png (Join-Path $playerRoot $name) (Join-Path $playerRoot ($name -replace '\.png$', '_optimized.png')) 512
}

foreach ($name in @('dino_coin.png', 'meat_food_item.png', 'rare_egg_shard.png')) {
  Resize-Png (Join-Path $collectibleRoot $name) (Join-Path $collectibleRoot ($name -replace '\.png$', '_optimized.png')) 256
}

$sheet = [Drawing.Bitmap]::new(2048, 512, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
try {
  $graphics = [Drawing.Graphics]::FromImage($sheet)
  try {
    $graphics.Clear([Drawing.Color]::Transparent)
    $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    for ($frame = 1; $frame -le 4; $frame++) {
      $inputImage = [Drawing.Image]::FromFile((Join-Path $playerRoot "carnotaurus_run_$frame.png"))
      try { $graphics.DrawImage($inputImage, (($frame - 1) * 512), 0, 512, 512) } finally { $inputImage.Dispose() }
    }
  } finally { $graphics.Dispose() }
  $sheet.Save((Join-Path $playerRoot 'carnotaurus_run_sheet.png'), [Drawing.Imaging.ImageFormat]::Png)
} finally { $sheet.Dispose() }
