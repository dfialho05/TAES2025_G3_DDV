@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.example.android

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.PI
import androidx.compose.ui.graphics.Path

@Composable
fun HomeScreen(onPlayOptions: () -> Unit, onViewGames: () -> Unit, isDark: Boolean, onToggleTheme: () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyColumn(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
            item { TopBar(isDark = isDark, onToggleTheme = onToggleTheme) }
            item {
                // Hero now receives callbacks
                HeroSection(onPlayNow = onPlayOptions, onViewGames = onViewGames)
            }
            item {
                Spacer(modifier = Modifier.height(24.dp))
                FeaturesSection(onFeatureSelected = onPlayOptions)
            }
            item { Spacer(modifier = Modifier.height(48.dp)) }
        }
    }
}

@Composable
fun PlayOptionsScreen(onStartGame: () -> Unit, onBack: () -> Unit, isDark: Boolean, onToggleTheme: () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            TopBar(isDark = isDark, onToggleTheme = onToggleTheme)
            Spacer(modifier = Modifier.height(24.dp))
            Text(text = "Jogar", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            // First option
            Card(modifier = Modifier.fillMaxWidth().padding(8.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF111827))) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Single-player vs Bot", fontWeight = FontWeight.SemiBold, color = Color.White)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = "Joga contra a inteligência artificial. Ideal para praticar!", color = Color(0xFF9CA3AF))
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        Button(onClick = onStartGame) {
                            Text("Jogar")
                        }
                    }
                }
            }
            // Second option
            Card(modifier = Modifier.fillMaxWidth().padding(8.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF111827))) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Multiplayer Online", fontWeight = FontWeight.SemiBold, color = Color.White)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = "Desafia jogadores reais de todo o mundo!", color = Color(0xFF9CA3AF))
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        Button(onClick = onStartGame) {
                            Text("Procurar Jogo")
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = onBack) { Text("Voltar") }
        }
    }
}

@Composable
fun GameScreen(onExit: () -> Unit, isDark: Boolean, onToggleTheme: () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(modifier = Modifier.fillMaxSize()) {
            TopBar(isDark = isDark, onToggleTheme = onToggleTheme)
            Spacer(modifier = Modifier.height(8.dp))
            // Add an exit button aligned to the end
            Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.End) {
                Button(onClick = onExit) { Text("Sair") }
            }
            // Reuse the existing GamePreviewSection as the gameplay area
            GamePreviewSection()
        }
    }
}

// Change HeroSection to accept callbacks
@Composable
fun HeroSection(onPlayNow: () -> Unit = {}, onViewGames: () -> Unit = {}) {
    Column(modifier = Modifier
        .fillMaxWidth()
        .background(brush = Brush.verticalGradient(colors = listOf(Color(0xFF3B82F6), Color(0xFF2563EB))))
        .padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Bem-vindo à Bisca Platform", fontSize = 36.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
        Spacer(modifier = Modifier.height(12.dp))
        Text(text = "A melhor experiência de jogo de cartas Bisca online", color = Color(0xFFEBF3FF))
        Spacer(modifier = Modifier.height(20.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Button(onClick = onPlayNow) { Text("Jogar Agora") }
            Button(onClick = onViewGames) { Text("Ver Jogos") }
        }
    }
}

@Composable
fun FeaturesSection(onFeatureSelected: () -> Unit) {
    Column(modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 8.dp)) {
        Text(text = "Funcionalidades", fontSize = 28.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 12.dp))
        val itemsList = listOf(
            FeatureData("Single-player vs Bot", "Joga contra IA avançada e aprimora as tuas habilidades"),
            FeatureData("Multiplayer Online", "Desafia jogadores de todo o mundo em tempo real"),
            FeatureData("Classificações", "Compete pelos primeiros lugares da tabela global"),
            FeatureData("Modo Espectador", "Assiste a partidas em tempo real"),
            FeatureData("Torneios", "Participa em torneios semanais")
        )

        // Horizontal scrollable list of feature cards so all modes are accessible on small screens
        LazyRow(
            contentPadding = PaddingValues(start = 24.dp, end = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            items(itemsList) { item ->
                Box(modifier = Modifier.padding(horizontal = 8.dp)) {
                    FeatureCard(data = item, onClick = onFeatureSelected)
                }
            }
        }
    }
}

data class FeatureData(val title: String, val subtitle: String)

@Composable
fun FeatureCard(data: FeatureData, onClick: () -> Unit) {
    Card(modifier = Modifier
        .width(200.dp)
        .height(140.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF111827).copy(alpha = 0.9f))) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.SpaceBetween) {
            Text(text = data.title, fontWeight = FontWeight.SemiBold, color = Color.White)
            Text(text = data.subtitle, color = Color(0xFF9CA3AF))
            Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                Button(onClick = onClick) {
                    Text("Jogar")
                }
            }
        }
    }
}

@Composable
fun GamePreviewSection() {
    Column(modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "Jogo — Pré-visualização", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(12.dp))
        Box(modifier = Modifier
            .fillMaxWidth()
            .height(360.dp)
            .background(Color(0xFF0F5132), shape = RoundedCornerShape(8.dp))) {
            // Simplified preview layout: deck, table and sample cards
            Row(modifier = Modifier.fillMaxSize(), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
                SampleDeck()
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Mesa", color = Color.White, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                        SampleCard("Trunfo", Color.Red)
                        SampleCard("Bot", Color.White)
                        SampleCard("Tu", Color(0xFF9CA3AF))
                    }
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Pontuação", color = Color.White, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Bot: 85", color = Color.White)
                    Text(text = "Tu: 120", color = Color.White)
                }
            }
        }
    }
}

@Composable
fun SampleDeck() {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(modifier = Modifier
            .size(96.dp)
            .border(4.dp, Color.White, shape = RoundedCornerShape(8.dp))
            .background(Color(0xFF7C2D2D))) {

        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "22 cartas", color = Color.White)
    }
}

@Composable
fun SampleCard(label: String, tint: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(modifier = Modifier
            .size(width = 92.dp, height = 128.dp)
            .background(Color.White, shape = RoundedCornerShape(8.dp))) {
            Text(text = label, modifier = Modifier.align(Alignment.Center), color = tint)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = label, color = Color.White)
    }
}

@Composable
fun Hexagon(modifier: Modifier = Modifier, size: Int = 20, color: Color = Color(0xFF3B82F6)) {
    Canvas(modifier = modifier.size(size.dp)) {
         val path = Path().apply {
             val cx = size / 2f
             val cy = size / 2f
             val r = size / 2f
             for (i in 0 until 6) {
                 val angle = (PI / 3 * i).toFloat()
                 val x = cx + r * cos(angle)
                 val y = cy + r * sin(angle)
                 if (i == 0) moveTo(x, y) else lineTo(x, y)
             }
             close()
         }
         drawPath(path = path, color = color)
     }
}

@Composable
fun TopBar(isDark: Boolean, onToggleTheme: () -> Unit) {
    TopAppBar(
        title = {
            Box(modifier = Modifier.fillMaxWidth()) {
                // Left: hexagon + title
                Row(modifier = Modifier.align(Alignment.CenterStart), verticalAlignment = Alignment.CenterVertically) {
                    Hexagon(size = 18, color = Color(0xFF2563EB), modifier = Modifier.padding(end = 8.dp))
                    Text(text = "Bisca Platform", fontWeight = FontWeight.Bold, color = Color.White)
                }

                // Center: label-like buttons
                Row(modifier = Modifier.align(Alignment.Center), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(modifier = Modifier
                        .background(Color.Transparent, shape = RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp)) {
                        Text(text = "Classificações", color = Color(0xFFBFC9D6))
                    }
                    Box(modifier = Modifier
                        .background(Color.Transparent, shape = RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp)) {
                        Text(text = "Estatísticas", color = Color(0xFFBFC9D6))
                    }
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color(0xFF0F1720),
            titleContentColor = Color.White
        ),
        actions = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Theme toggle (sun icon)
                IconButton(onClick = onToggleTheme) {
                    Text(text = if (isDark) "☀" else "🌙", color = Color.White)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "Login", color = Color.White, modifier = Modifier.clickable { /* TODO: login */ }.padding(8.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Button(onClick = { /* TODO: register */ }) { Text("Registar") }
            }
        }
    )
}

@Preview(showBackground = true)
@Composable
fun MainScreenPreview() {
    HomeScreen(onPlayOptions = {}, onViewGames = {}, isDark = true, onToggleTheme = {})
}
