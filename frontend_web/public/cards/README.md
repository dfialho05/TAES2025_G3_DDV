# Card Assets Directory

This directory should contain card images for the Bisca game.

## File Naming Convention

Card images should be named using the following pattern:
- `{suit}{value}.png`

Where:
- **suit** is one of:
  - `c` - Copas (Hearts) ♥
  - `e` - Espadas (Spades) ♠
  - `o` - Ouros (Diamonds) ♦
  - `p` - Paus (Clubs) ♣

- **value** is one of:
  - `1` - Ás (Ace)
  - `2` - 2
  - `3` - 3
  - `4` - 4
  - `5` - 5
  - `6` - 6
  - `7` - 7
  - `11` - Valete (Jack)
  - `12` - Dama (Queen)
  - `13` - Rei (King)

## Examples

- `c1.png` - Ás de Copas (Ace of Hearts)
- `e7.png` - 7 de Espadas (7 of Spades)
- `o12.png` - Dama de Ouros (Queen of Diamonds)
- `p13.png` - Rei de Paus (King of Clubs)

## Additional Files

- `semFace.png` - Card back image

## Current Implementation

The Card component automatically generates SVG cards as fallbacks when PNG images are not found. To use custom card images:

1. Add properly named PNG files to this directory
2. Ensure images are rectangular with appropriate aspect ratio (approximately 2:3)
3. Recommended resolution: 160x224 pixels or higher

## Notes

- Images should have transparent or white backgrounds
- Cards should be oriented vertically (portrait)
- File names are case-sensitive
- The component will fallback to generated SVG cards if images are missing