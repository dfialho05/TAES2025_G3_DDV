package com.example.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.android.ui.theme.AndroidTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember

class MainActivity : ComponentActivity() {
    private enum class Screen { HOME, PLAY_OPTIONS, GAME }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            var screen by remember { mutableStateOf(Screen.HOME) }
            var isDark by remember { mutableStateOf(true) }

            AndroidTheme(darkTheme = isDark) {
                val toggleTheme = { isDark = !isDark }

                when (screen) {
                    Screen.HOME -> HomeScreen(
                        onPlayOptions = { screen = Screen.PLAY_OPTIONS },
                        onViewGames = { screen = Screen.PLAY_OPTIONS },
                        isDark = isDark,
                        onToggleTheme = toggleTheme
                    )
                    Screen.PLAY_OPTIONS -> PlayOptionsScreen(
                        onStartGame = { screen = Screen.GAME },
                        onBack = { screen = Screen.HOME },
                        isDark = isDark,
                        onToggleTheme = toggleTheme
                    )
                    Screen.GAME -> GameScreen(onExit = { screen = Screen.HOME }, isDark = isDark, onToggleTheme = toggleTheme)
                }
            }
        }
    }
}
