#!/bin/bash

# Script para criar variações visuais nos decks usando ImageMagick
# Apenas funciona em sistemas Linux com ImageMagick instalado
# Este script cria diferentes temas para os decks aplicando filtros de cor

# Verificar se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "ImageMagick não está instalado. Instale com:"
    echo "Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "macOS: brew install imagemagick"
    echo "CentOS/RHEL: sudo yum install ImageMagick"
    exit 1
fi

# Diretório base
BASE_DIR="$(dirname "$0")"
STORAGE_DIR="$BASE_DIR/api/storage/app/public/decks"
DEFAULT_DIR="$STORAGE_DIR/default"

echo "🎨 Criando variações dos decks..."

# Verificar se o diretório default existe
if [ ! -d "$DEFAULT_DIR" ]; then
    echo "❌ Diretório default não encontrado: $DEFAULT_DIR"
    exit 1
fi

# Função para aplicar filtro de fogo (vermelho/laranja)
create_fire_deck() {
    echo "🔥 Criando deck Fire..."
    FIRE_DIR="$STORAGE_DIR/fire"

    for img in "$DEFAULT_DIR"/*.png; do
        filename=$(basename "$img")

        # Aplicar filtro vermelho/laranja para efeito de fogo
        convert "$img" \
            -modulate 110,150,105 \
            -fill '#ff4500' -colorize 15% \
            -brightness-contrast 5x10 \
            "$FIRE_DIR/$filename"
    done
    echo "✅ Fire deck criado!"
}

# Função para aplicar filtro de gelo (azul/ciano)
create_ice_deck() {
    echo "❄️ Criando deck Ice..."
    ICE_DIR="$STORAGE_DIR/ice"

    for img in "$DEFAULT_DIR"/*.png; do
        filename=$(basename "$img")

        # Aplicar filtro azul/ciano para efeito de gelo
        convert "$img" \
            -modulate 105,130,110 \
            -fill '#4169e1' -colorize 12% \
            -brightness-contrast -5x15 \
            "$ICE_DIR/$filename"
    done
    echo "✅ Ice deck criado!"
}

# Função para aplicar filtro dourado
create_gold_deck() {
    echo "🏆 Criando deck Gold..."
    GOLD_DIR="$STORAGE_DIR/gold"

    for img in "$DEFAULT_DIR"/*.png; do
        filename=$(basename "$img")

        # Aplicar filtro dourado/sepia
        convert "$img" \
            -modulate 115,140,108 \
            -sepia-tone 25% \
            -fill '#ffd700' -colorize 8% \
            -brightness-contrast 8x12 \
            "$GOLD_DIR/$filename"
    done
    echo "✅ Gold deck criado!"
}

# Função alternativa mais simples usando apenas -colorize
create_simple_variations() {
    echo "🎨 Criando variações simples..."

    # Fire deck - colorização vermelha com saturação
    echo "🔥 Aplicando efeito Fire (vermelho)..."
    for img in "$DEFAULT_DIR"/*.png; do
        filename=$(basename "$img")
        convert "$img" -modulate 105,130,102 -fill red -colorize 12% "$STORAGE_DIR/fire/$filename"
    done

    # Ice deck - colorização azul com brilho
    echo "❄️ Aplicando efeito Ice (azul)..."
    for img in "$DEFAULT_DIR"/*.png; do
        filename=$(basename "$img")
        convert "$img" -modulate 102,125,108 -fill blue -colorize 10% "$STORAGE_DIR/ice/$filename"
    done

    # Gold deck - sepia + amarelo
    echo "🏆 Aplicando efeito Gold (dourado)..."
    for img in "$DEFAULT_DIR"/*.png; do
        filename=$(basename "$img")
        convert "$img" -sepia-tone 20% -modulate 110,120,105 -fill gold -colorize 8% "$STORAGE_DIR/gold/$filename"
    done

    echo "✅ Variações simples criadas!"
}

# Verificar número de arquivos no diretório default
file_count=$(ls -1 "$DEFAULT_DIR"/*.png 2>/dev/null | wc -l)
if [ $file_count -eq 0 ]; then
    echo "❌ Nenhuma imagem PNG encontrada em $DEFAULT_DIR"
    exit 1
fi

echo "📁 Encontradas $file_count imagens no deck default"

# Menu de opções
echo ""
echo "Escolha o método de criação dos decks:"
echo "1) Filtros avançados (requer ImageMagick com suporte completo)"
echo "2) Variações simples (colorização básica)"
echo "3) Apenas copiar arquivos (sem modificações)"
read -p "Opção [1-3]: " choice

case $choice in
    1)
        echo "🚀 Usando filtros avançados..."
        create_fire_deck
        create_ice_deck
        create_gold_deck
        ;;
    2)
        echo "🎨 Usando variações simples..."
        create_simple_variations
        ;;
    3)
        echo "📋 Copiando arquivos sem modificações..."
        cp "$DEFAULT_DIR"/* "$STORAGE_DIR/fire/"
        cp "$DEFAULT_DIR"/* "$STORAGE_DIR/ice/"
        cp "$DEFAULT_DIR"/* "$STORAGE_DIR/gold/"
        echo "✅ Arquivos copiados!"
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "🎉 Processo concluído!"
echo ""
echo "📊 Resumo dos decks:"
echo "  Default: $(ls -1 "$DEFAULT_DIR"/*.png 2>/dev/null | wc -l) imagens"
echo "  Fire:    $(ls -1 "$STORAGE_DIR/fire"/*.png 2>/dev/null | wc -l) imagens"
echo "  Ice:     $(ls -1 "$STORAGE_DIR/ice"/*.png 2>/dev/null | wc -l) imagens"
echo "  Gold:    $(ls -1 "$STORAGE_DIR/gold"/*.png 2>/dev/null | wc -l) imagens"
echo ""
echo "🚀 Os decks estão prontos para uso!"
echo "💡 Dica: Reinicie o servidor Laravel se estiver rodando"
