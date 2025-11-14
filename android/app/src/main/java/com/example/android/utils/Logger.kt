package com.example.android.utils

import android.util.Log

/**
 * Logger utility for the Bisca Android application
 */
object Logger {
    private const val TAG = "BiscaApp"
    private var isDebugEnabled = true

    fun enableDebug(enabled: Boolean) {
        isDebugEnabled = enabled
    }

    fun d(message: String, tag: String = TAG) {
        if (isDebugEnabled) {
            Log.d(tag, message)
        }
    }

    fun i(message: String, tag: String = TAG) {
        Log.i(tag, message)
    }

    fun w(message: String, tag: String = TAG, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.w(tag, message, throwable)
        } else {
            Log.w(tag, message)
        }
    }

    fun e(message: String, tag: String = TAG, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.e(tag, message, throwable)
        } else {
            Log.e(tag, message)
        }
    }

    fun gameEvent(message: String) {
        i("🎮 $message", "GameEvent")
    }

    fun networkEvent(message: String) {
        i("🌐 $message", "Network")
    }

    fun cardEvent(message: String) {
        i("🃏 $message", "Cards")
    }

    fun timerEvent(message: String) {
        i("⏱️ $message", "Timer")
    }
}
