package dev.kyu.karasu

import android.app.Activity
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable
import android.os.Build
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

// Hand-written (restore from git after a wiped re-init). Reached from Rust over JNI by name, so proguard keeps it.
object SystemBars {
  private const val PREFS = "karasu_system_bars"

  // The dark look's surface-950 and surface-900, for a first start before the theme store has said anything.
  private const val DEFAULT_STATUS = "#0b0d12"
  private const val DEFAULT_NAVIGATION = "#12141a"

  // The theme store's colours for the two strips; kept, so a restart opens in them rather than flashing the dark ones.
  @JvmStatic
  fun apply(context: Context, status: String, navigation: String, light: Boolean) {
    val activity = context as? Activity ?: return
    activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putString("status", status)
      .putString("navigation", navigation)
      .putBoolean("light", light)
      .apply()
    activity.runOnUiThread { paint(activity, status, navigation, light) }
  }

  // The last colours `apply` kept, from the activity's onCreate.
  @JvmStatic
  fun restore(activity: Activity) {
    val prefs = activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    paint(
      activity,
      prefs.getString("status", null) ?: DEFAULT_STATUS,
      prefs.getString("navigation", null) ?: DEFAULT_NAVIGATION,
      prefs.getBoolean("light", false),
    )
  }

  private fun paint(activity: Activity, status: String, navigation: String, light: Boolean) {
    val window = activity.window
    val decor = window.decorView
    // Edge-to-edge leaves both strips over the window's own ground, so that ground is what they show.
    window.setBackgroundDrawable(Strips(Color.parseColor(status), Color.parseColor(navigation)) {
      ViewCompat.getRootWindowInsets(decor)?.getInsets(WindowInsetsCompat.Type.navigationBars())?.bottom ?: 0
    })
    val controller = WindowInsetsControllerCompat(window, decor)
    controller.isAppearanceLightStatusBars = light
    controller.isAppearanceLightNavigationBars = light
    // The glyphs now follow the app's look, so the bar must not keep a scrim chosen from the system's.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      @Suppress("DEPRECATION")
      window.navigationBarColor = Color.TRANSPARENT
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) window.isNavigationBarContrastEnforced = false
  }

  // The page's ground everywhere the content leaves open, and the bottom bar's under the navigation strip alone.
  private class Strips(
    private val page: Int,
    private val bar: Int,
    private val navigationHeight: () -> Int,
  ) : Drawable() {
    private val paint = Paint()

    override fun draw(canvas: Canvas) {
      val b = bounds
      paint.color = page
      canvas.drawRect(b.left.toFloat(), b.top.toFloat(), b.right.toFloat(), b.bottom.toFloat(), paint)
      val height = navigationHeight()
      if (height <= 0) return
      paint.color = bar
      canvas.drawRect(b.left.toFloat(), (b.bottom - height).toFloat(), b.right.toFloat(), b.bottom.toFloat(), paint)
    }

    override fun setAlpha(alpha: Int) {}

    override fun setColorFilter(colorFilter: ColorFilter?) {}

    @Deprecated("Deprecated in Java")
    override fun getOpacity(): Int = PixelFormat.OPAQUE
  }
}
