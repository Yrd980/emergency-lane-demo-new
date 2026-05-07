package com.emergency.lane.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Aegis Traffic Design System — Dark Theme Colors
val AegisBackground = Color(0xFF13131b)
val AegisSurface = Color(0xFF1b1b23)
val AegisSurfaceContainer = Color(0xFF1f1f27)
val AegisSurfaceContainerHigh = Color(0xFF2a2932)
val AegisOnSurface = Color(0xFFe4e1ed)
val AegisOnSurfaceVariant = Color(0xFFc7c4d7)
val AegisOutline = Color(0xFF918fa0)
val AegisOutlineVariant = Color(0xFF464554)

val AegisPrimary = Color(0xFFc2c1ff)
val AegisOnPrimary = Color(0xFF1800a7)
val AegisPrimaryContainer = Color(0xFF5e5ce6)
val AegisOnPrimaryContainer = Color(0xFFf4f1ff)

val AegisSecondary = Color(0xFFffb5a0)
val AegisOnSecondary = Color(0xFF5f1500)
val AegisSecondaryContainer = Color(0xFFd73b00)
val AegisOnSecondaryContainer = Color(0xFFfffbff)

val AegisError = Color(0xFFffb4ab)
val AegisErrorContainer = Color(0xFF93000a)

private val AegisDarkColorScheme = darkColorScheme(
    primary = AegisPrimary,
    onPrimary = AegisOnPrimary,
    primaryContainer = AegisPrimaryContainer,
    onPrimaryContainer = AegisOnPrimaryContainer,
    secondary = AegisSecondary,
    onSecondary = AegisOnSecondary,
    secondaryContainer = AegisSecondaryContainer,
    onSecondaryContainer = AegisOnSecondaryContainer,
    error = AegisError,
    errorContainer = AegisErrorContainer,
    background = AegisBackground,
    onBackground = AegisOnSurface,
    surface = AegisSurface,
    onSurface = AegisOnSurface,
    surfaceVariant = AegisSurfaceContainer,
    onSurfaceVariant = AegisOnSurfaceVariant,
    outline = AegisOutline,
    outlineVariant = AegisOutlineVariant,
)

@Composable
fun AegisTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AegisDarkColorScheme,
        content = content,
    )
}
