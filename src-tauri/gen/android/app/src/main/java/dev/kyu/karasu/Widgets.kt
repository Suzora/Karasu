package dev.kyu.karasu

// Hand-written (restore from git after a wiped re-init): the seven home-screen widgets, drawn from widgets.rs's file.

import android.app.Activity
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.util.Log
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/** Called from Rust over JNI by name, so its proguard keep is load-bearing; updates only the placed widget types. */
object WidgetRefresher {
  private val KINDS = listOf(
    "airing" to Widgets.AiringToday::class.java,
    "watching" to Widgets.ContinueWatching::class.java,
    "reading" to Widgets.ContinueReading::class.java,
    "week" to Widgets.Week::class.java,
    "figures" to Widgets.Figures::class.java,
    "ring" to Widgets.Ring::class.java,
    "year" to Widgets.Year::class.java,
  )

  @JvmStatic
  fun refresh(context: Context) {
    try {
      val mgr = AppWidgetManager.getInstance(context)
      for ((_, cls) in KINDS) {
        val ids = mgr.getAppWidgetIds(ComponentName(context, cls))
        if (ids.isEmpty()) continue
        val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
          .setClass(context, cls)
          .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        context.sendBroadcast(intent)
      }
    } catch (t: Throwable) {
      Log.w("KarasuWidgets", "refresh failed", t)
    }
  }

  /** Every placed widget as a JSON list of id and kind, which the settings sheet lists. */
  @JvmStatic
  fun placed(context: Context): String {
    val out = JSONArray()
    try {
      val mgr = AppWidgetManager.getInstance(context)
      for ((kind, cls) in KINDS) {
        for (id in mgr.getAppWidgetIds(ComponentName(context, cls))) {
          out.put(JSONObject().put("id", id).put("kind", kind))
        }
      }
    } catch (t: Throwable) {
      Log.w("KarasuWidgets", "placed failed", t)
    }
    return out.toString()
  }
}

/** The launcher's configure target: answers at once so the widget is placed, then opens Karasu on that widget's sheet. */
class WidgetConfigActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val id = intent?.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
      ?: AppWidgetManager.INVALID_APPWIDGET_ID
    setResult(RESULT_OK, Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id))
    if (id != AppWidgetManager.INVALID_APPWIDGET_ID) {
      try {
        startActivity(
          Intent(Intent.ACTION_VIEW, Uri.parse("karasu://widget/$id"))
            .setClass(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
      } catch (t: Throwable) {
        Log.w("KarasuWidgets", "configure failed", t)
      }
    }
    finish()
  }
}

/** One placed widget's settings as widgets.rs wrote them, with the defaults for a widget nobody configured. */
class WidgetSettings(o: JSONObject?) {
  val planning = o?.optString("list") == "planning"
  val manga = o?.optString("media") == "manga"
  val compact = o?.optBoolean("compact") ?: false
  val systemAccent = o?.optString("accent") == "system"
  val opacity = (o?.optInt("opacity", 100) ?: 100).coerceIn(70, 100)
  val tapsOpenList = o?.optString("tap") == "list"
}

/** Everything one draw needs: the file, the settings, the size the launcher gave and the colours that follow from them. */
class WidgetDraw(
  val context: Context,
  val views: RemoteViews,
  val doc: JSONObject,
  val settings: WidgetSettings,
  val widthDp: Int,
  val heightDp: Int,
  val now: Long,
) {
  val labels: JSONObject = doc.optJSONObject("labels") ?: JSONObject()
  val density: Float = context.resources.displayMetrics.density
  val ink: Int = context.getColor(R.color.kw_ink_100)
  // Over a see-through background the muted text rises a step, or it fails its contrast on a light wallpaper.
  val muted: Int = context.getColor(if (settings.opacity < 100) R.color.kw_ink_300 else R.color.kw_ink_500)
  val accent: Int = accentColour()

  fun label(key: String, fallback: String): String = labels.optString(key).takeIf { it.isNotEmpty() } ?: fallback

  fun px(dp: Float): Int = (dp * density).toInt().coerceAtLeast(1)

  private fun accentColour(): Int {
    if (settings.systemAccent && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      return context.getColor(android.R.color.system_accent1_200)
    }
    return try {
      Color.parseColor(doc.optString("accent"))
    } catch (t: Throwable) {
      context.getColor(R.color.kw_accent)
    }
  }

  /** A tap target inside Karasu; the deep-link plugin routes the address. */
  fun open(address: String): PendingIntent = PendingIntent.getActivity(
    context,
    0,
    Intent(Intent.ACTION_VIEW, Uri.parse(address))
      .setClass(context, MainActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  )

  /** Where a tap on a title leads: the title, or its list when the widget is set that way. */
  fun openTitle(type: String, id: Long, list: String): PendingIntent =
    open(if (settings.tapsOpenList || id <= 0L) "karasu://open/$list" else "https://anilist.co/$type/$id")
}

/** The pictures a widget cannot lay out from views: covers, bars and the two charts. */
object WidgetArt {
  /** A cover from the cache, cropped to the box and rounded; a missing file is a quiet tile with the title's first letter. */
  fun cover(d: WidgetDraw, id: Long, title: String, widthDp: Float, heightDp: Float): Bitmap {
    val scale = minOf(d.density, 2.5f)
    val w = (widthDp * scale).toInt().coerceAtLeast(1)
    val h = (heightDp * scale).toInt().coerceAtLeast(1)
    val out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(out)
    val box = RectF(0f, 0f, w.toFloat(), h.toFloat())
    val radius = minOf(w, h) * 0.1f
    val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    val source = decode(File(d.context.cacheDir, "widget-covers/$id"), w, h)
    if (source != null) {
      val fit = maxOf(w.toFloat() / source.width, h.toFloat() / source.height)
      val matrix = Matrix()
      matrix.setScale(fit, fit)
      matrix.postTranslate((w - source.width * fit) / 2f, (h - source.height * fit) / 2f)
      val shader = BitmapShader(source, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
      shader.setLocalMatrix(matrix)
      paint.shader = shader
      canvas.drawRoundRect(box, radius, radius, paint)
    } else {
      paint.color = d.context.getColor(R.color.kw_surface_800)
      canvas.drawRoundRect(box, radius, radius, paint)
      paint.color = d.context.getColor(R.color.kw_ink_600)
      paint.textAlign = Paint.Align.CENTER
      paint.textSize = minOf(w, h) * 0.5f
      paint.typeface = Typeface.DEFAULT_BOLD
      val letter = title.trim().take(1).uppercase(Locale.getDefault())
      canvas.drawText(letter, w / 2f, h / 2f - (paint.descent() + paint.ascent()) / 2f, paint)
    }
    return out
  }

  private fun decode(file: File, w: Int, h: Int): Bitmap? = try {
    if (!file.isFile) {
      null
    } else {
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeFile(file.path, bounds)
      var sample = 1
      while (bounds.outWidth / (sample * 2) >= w && bounds.outHeight / (sample * 2) >= h) sample *= 2
      BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample })
    }
  } catch (t: Throwable) {
    null
  }

  /** A progress bar; without a known total the track is dashed, since no share of it is known. */
  fun bar(d: WidgetDraw, fraction: Float?): Bitmap {
    val w = d.px(220f)
    val h = d.px(5f)
    val out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(out)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.color = d.context.getColor(R.color.kw_surface_700)
    val r = h / 2f
    if (fraction == null) {
      val dash = h * 1.6f
      var x = 0f
      while (x < w) {
        canvas.drawRoundRect(RectF(x, 0f, minOf(x + dash, w.toFloat()), h.toFloat()), r, r, paint)
        x += dash * 1.8f
      }
      return out
    }
    canvas.drawRoundRect(RectF(0f, 0f, w.toFloat(), h.toFloat()), r, r, paint)
    paint.color = d.accent
    val filled = (w * fraction.coerceIn(0f, 1f)).coerceAtLeast(if (fraction > 0f) h.toFloat() else 0f)
    if (filled > 0f) canvas.drawRoundRect(RectF(0f, 0f, filled, h.toFloat()), r, r, paint)
    return out
  }

  /** The list's statuses as one segmented bar. */
  fun segments(d: WidgetDraw, values: LongArray, colours: IntArray): Bitmap {
    val w = d.px(300f)
    val h = d.px(8f)
    val gap = d.px(2f).toFloat()
    val out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(out)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    val total = values.sum().coerceAtLeast(1L)
    val shown = values.count { it > 0L }
    val room = w - gap * (shown - 1).coerceAtLeast(0)
    var x = 0f
    for ((i, v) in values.withIndex()) {
      if (v <= 0L) continue
      val width = room * v / total
      paint.color = colours[i]
      canvas.drawRoundRect(RectF(x, 0f, x + width, h.toFloat()), h / 2f, h / 2f, paint)
      x += width + gap
    }
    return out
  }

  /** The list's statuses as a ring around the number of titles. */
  fun ring(d: WidgetDraw, values: LongArray, colours: IntArray, centre: String, caption: String, sizeDp: Float): Bitmap {
    val size = d.px(sizeDp)
    val out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(out)
    val stroke = size * 0.13f
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = stroke
    val box = RectF(stroke / 2f, stroke / 2f, size - stroke / 2f, size - stroke / 2f)
    val total = values.sum()
    if (total <= 0L) {
      paint.color = d.context.getColor(R.color.kw_surface_700)
      canvas.drawArc(box, 0f, 360f, false, paint)
    } else {
      var start = -90f
      for ((i, v) in values.withIndex()) {
        if (v <= 0L) continue
        val sweep = 360f * v / total
        paint.color = colours[i]
        canvas.drawArc(box, start, sweep, false, paint)
        start += sweep
      }
    }
    val text = Paint(Paint.ANTI_ALIAS_FLAG)
    text.textAlign = Paint.Align.CENTER
    text.color = d.ink
    text.typeface = Typeface.DEFAULT_BOLD
    text.textSize = size * 0.2f
    canvas.drawText(centre, size / 2f, size / 2f + size * 0.02f, text)
    text.color = d.muted
    text.typeface = Typeface.DEFAULT
    text.textSize = size * 0.1f
    canvas.drawText(caption, size / 2f, size / 2f + size * 0.16f, text)
    return out
  }

  /** The year's completions as a bar per month, the running month in the accent, each over its initial. */
  fun months(d: WidgetDraw, values: LongArray, current: Int, widthDp: Float, heightDp: Float): Bitmap {
    val w = d.px(widthDp)
    val h = d.px(heightDp)
    val out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(out)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    val text = Paint(Paint.ANTI_ALIAS_FLAG)
    text.textAlign = Paint.Align.CENTER
    text.color = d.context.getColor(R.color.kw_ink_600)
    text.textSize = d.px(9f).toFloat()
    val letters = d.px(13f).toFloat()
    val gap = d.px(4f).toFloat()
    val slot = (w + gap) / 12f
    val top = values.maxOrNull()?.coerceAtLeast(1L) ?: 1L
    val room = h - letters
    val radius = d.px(3f).toFloat()
    val names = SimpleDateFormat("MMMMM", Locale.getDefault())
    val cal = Calendar.getInstance()
    for (i in 0 until 12) {
      val x = slot * i
      val height = if (values[i] <= 0L) d.px(2f).toFloat() else maxOf(room * values[i] / top, d.px(4f).toFloat())
      paint.color = if (i == current) d.accent else d.context.getColor(R.color.kw_surface_600)
      canvas.drawRoundRect(RectF(x, room - height, x + slot - gap, room), radius, radius, paint)
      cal.set(2001, i, 1)
      canvas.drawText(names.format(cal.time), x + (slot - gap) / 2f, h - d.px(2f).toFloat(), text)
    }
    return out
  }
}

/** Reads the projection, frames one widget and leaves the body to the kind; dates are bucketed at draw time. */
abstract class KarasuWidgetBase : AppWidgetProvider() {
  companion object {
    /** Past this age the footer says "open Karasu": the file is a cache. */
    const val STALE_MS = 48L * 60 * 60 * 1000
    /** The share of the reported height a launcher really gives, since some count their own padding into it. */
    const val ROOM = 0.85f

    fun doc(context: Context): JSONObject? = try {
      // dataDir, not filesDir: Tauri's app_data_dir is the package root, where widgets.rs writes beside karasu.db.
      JSONObject(File(context.dataDir, "widgets.json").readText())
    } catch (t: Throwable) {
      null
    }
  }

  abstract val layout: Int
  /** Where a tap on the header leads, as a `karasu://open/` name. */
  abstract val home: String
  // The resource behind the title when there is no projection yet, so a signed-out phone reads its own language.
  abstract fun titleRes(): Int
  abstract fun title(d: WidgetDraw): String
  /** Draws the body and answers whether there was anything to show. */
  abstract fun fill(d: WidgetDraw): Boolean

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val doc = doc(context)
    for (id in ids) {
      try {
        draw(context, manager, id, doc)
      } catch (t: Throwable) {
        Log.w("KarasuWidgets", "draw failed", t)
      }
    }
  }

  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
    onUpdate(context, manager, intArrayOf(id))
  }

  /** The widget's size in dp for the way the phone is held: the launcher's size list where it sends one, its range otherwise. */
  private fun sizeOf(context: Context, options: Bundle): Pair<Int, Int> {
    val portrait = context.resources.configuration.orientation != Configuration.ORIENTATION_LANDSCAPE
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val sizes = options.getParcelableArrayList<SizeF>(AppWidgetManager.OPTION_APPWIDGET_SIZES)
      val pick = if (portrait) sizes?.minByOrNull { it.width } else sizes?.maxByOrNull { it.width }
      if (pick != null) return pick.width.toInt() to (pick.height * ROOM).toInt()
    }
    return if (portrait) {
      options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250) to (options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 110) * ROOM).toInt()
    } else {
      options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 250) to (options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110) * ROOM).toInt()
    }
  }

  private fun draw(context: Context, manager: AppWidgetManager, id: Int, doc: JSONObject?) {
    val views = RemoteViews(context.packageName, layout)
    val now = System.currentTimeMillis()
    val options = manager.getAppWidgetOptions(id)
    val size = sizeOf(context, options)
    val settings = WidgetSettings(doc?.optJSONObject("config")?.optJSONObject(id.toString()))
    views.setInt(R.id.w_bg, "setImageAlpha", settings.opacity * 255 / 100)
    views.setOnClickPendingIntent(
      R.id.w_root,
      PendingIntent.getActivity(
        context,
        0,
        Intent(Intent.ACTION_VIEW, Uri.parse("karasu://open/$home"))
          .setClass(context, MainActivity::class.java)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      ),
    )
    if (doc == null) {
      views.setTextViewText(R.id.w_title, context.getString(titleRes()))
      views.setTextViewText(R.id.w_footer, context.getString(R.string.widget_open))
      views.setViewVisibility(R.id.w_footer, View.VISIBLE)
      manager.updateAppWidget(id, views)
      return
    }
    val d = WidgetDraw(
      context,
      views,
      doc,
      settings,
      size.first,
      size.second,
      now,
    )
    views.setTextViewText(R.id.w_title, title(d))
    views.setTextColor(R.id.w_count, d.muted)
    views.setTextColor(R.id.w_footer, d.muted)
    val shown = fill(d)
    val footer = when {
      now - doc.optLong("generatedAtMs") > STALE_MS -> d.label("stale", context.getString(R.string.widget_open))
      !shown -> d.label("empty", "")
      else -> ""
    }
    views.setTextViewText(R.id.w_footer, footer)
    views.setViewVisibility(R.id.w_footer, if (footer.isEmpty()) View.GONE else View.VISIBLE)
    manager.updateAppWidget(id, views)
  }

  protected fun rows(d: WidgetDraw, key: String): List<JSONObject> {
    val arr = d.doc.optJSONArray(key) ?: return emptyList()
    return (0 until arr.length()).map { arr.getJSONObject(it) }
  }

  /** Monday-first index for the projection's `days` array. */
  protected fun dayIndex(ms: Long): Int {
    val cal = Calendar.getInstance().apply { timeInMillis = ms }
    return (cal.get(Calendar.DAY_OF_WEEK) + 5) % 7
  }

  protected fun sameDay(a: Long, b: Long): Boolean {
    val ca = Calendar.getInstance().apply { timeInMillis = a }
    val cb = Calendar.getInstance().apply { timeInMillis = b }
    return ca.get(Calendar.YEAR) == cb.get(Calendar.YEAR) &&
      ca.get(Calendar.DAY_OF_YEAR) == cb.get(Calendar.DAY_OF_YEAR)
  }

  protected fun clock(ms: Long): String =
    SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(ms))

  protected fun whole(n: Long): String = NumberFormat.getIntegerInstance().format(n)
}

/** One title large with its cover beside the text, and up to three more as small rows below. */
abstract class FocusWidget : KarasuWidgetBase() {
  override val layout = R.layout.karasu_widget_focus

  protected class Small(val id: Long, val title: String, val sub: String, val faded: Boolean = false)

  protected fun hero(d: WidgetDraw, id: Long, title: String, label: String, big: String, sub: String, tap: PendingIntent) {
    val v = d.views
    v.setViewVisibility(R.id.w_hero, View.VISIBLE)
    v.setImageViewBitmap(R.id.w_hero_cover, WidgetArt.cover(d, id, title, 60f, 88f))
    v.setTextViewText(R.id.w_hero_label, label)
    v.setTextColor(R.id.w_hero_label, d.accent)
    v.setTextViewText(R.id.w_hero_title, title)
    v.setTextViewText(R.id.w_hero_big, big)
    v.setViewVisibility(R.id.w_hero_big, if (big.isEmpty()) View.GONE else View.VISIBLE)
    v.setTextViewText(R.id.w_hero_sub, sub)
    v.setTextColor(R.id.w_hero_sub, d.muted)
    v.setOnClickPendingIntent(R.id.w_hero, tap)
  }

  protected fun rest(d: WidgetDraw, items: List<Small>, type: String, list: String) {
    val v = d.views
    v.removeAllViews(R.id.w_rest)
    val room = if (d.widthDp < 250) 2 else 3
    if (d.settings.compact || d.heightDp < 178 || items.isEmpty()) {
      v.setViewVisibility(R.id.w_rest, View.GONE)
      return
    }
    v.setViewVisibility(R.id.w_rest, View.VISIBLE)
    for (item in items.take(room)) {
      val row = RemoteViews(d.context.packageName, R.layout.karasu_widget_item)
      row.setImageViewBitmap(R.id.w_item_cover, WidgetArt.cover(d, item.id, item.title, 22f, 31f))
      row.setTextViewText(R.id.w_item_title, item.title)
      row.setTextViewText(R.id.w_item_sub, item.sub)
      row.setTextColor(R.id.w_item_sub, d.muted)
      if (item.faded) row.setTextColor(R.id.w_item_title, d.muted)
      row.setOnClickPendingIntent(R.id.w_item, d.openTitle(type, item.id, list))
      v.addView(R.id.w_rest, row)
    }
  }

  protected fun nothing(d: WidgetDraw): Boolean {
    d.views.setViewVisibility(R.id.w_hero, View.GONE)
    d.views.setViewVisibility(R.id.w_rest, View.GONE)
    d.views.setTextViewText(R.id.w_count, "")
    return false
  }
}

/** The two continue widgets: the title touched last with its next episode or chapter, then the ones before it. */
abstract class ContinueWidget : FocusWidget() {
  abstract val currentKey: String
  abstract val planKey: String
  abstract val type: String
  abstract val unitKey: String
  abstract val unitFallback: String

  override fun fill(d: WidgetDraw): Boolean {
    val all = rows(d, if (d.settings.planning) planKey else currentKey)
    if (all.isEmpty()) return nothing(d)
    val first = all[0]
    val progress = first.optLong("progress")
    val total = if (first.isNull("total")) 0L else first.optLong("total")
    val next = if (total > 0L) minOf(progress + 1, total) else progress + 1
    d.views.setTextViewText(R.id.w_count, whole(all.size.toLong()))
    hero(
      d,
      first.optLong("id"),
      first.optString("title"),
      d.label("latest", ""),
      "${d.label(unitKey, unitFallback)} $next",
      if (total > 0L) "/ $total" else "",
      d.openTitle(type, first.optLong("id"), home),
    )
    d.views.setViewVisibility(R.id.w_hero_clock, View.GONE)
    d.views.setImageViewBitmap(R.id.w_hero_bar, WidgetArt.bar(d, if (total > 0L) progress.toFloat() / total else null))
    d.views.setViewVisibility(R.id.w_hero_bar, View.VISIBLE)
    rest(
      d,
      all.drop(1).map {
        val of = if (it.isNull("total")) "?" else it.optLong("total").toString()
        Small(it.optLong("id"), it.optString("title"), "${it.optLong("progress")} / $of")
      },
      type,
      home,
    )
    return true
  }
}

/** A statistics widget: one list's figures, anime unless the widget is set to manga. */
abstract class StatsWidget : KarasuWidgetBase() {
  override val home = "stats"
  override fun titleRes() = R.string.widget_stats_title

  override fun title(d: WidgetDraw): String =
    "${d.label("stats", d.context.getString(titleRes()))} · ${d.label(if (d.settings.manga) "statsManga" else "statsAnime", "")}"

  protected fun stats(d: WidgetDraw): JSONObject =
    d.doc.optJSONObject("stats")?.optJSONObject(if (d.settings.manga) "manga" else "anime") ?: JSONObject()

  protected fun statuses(s: JSONObject): LongArray = longArrayOf(
    s.optLong("completed"), s.optLong("current"), s.optLong("planning"), s.optLong("paused"), s.optLong("dropped"),
  )

  protected fun statusColours(d: WidgetDraw): IntArray = intArrayOf(
    d.context.getColor(R.color.kw_status_completed),
    d.context.getColor(R.color.kw_status_current),
    d.context.getColor(R.color.kw_status_planning),
    d.context.getColor(R.color.kw_status_paused),
    d.context.getColor(R.color.kw_status_dropped),
  )

  protected val statusKeys = listOf("completed", "current", "planning", "paused", "dropped")

  protected fun mean(s: JSONObject): String {
    if (s.isNull("meanScore")) return "—"
    val value = s.optDouble("meanScore")
    return if (value > 10.0) whole(Math.round(value)) else String.format(Locale.getDefault(), "%.1f", value)
  }

  /** The four figures of a list as value and label: time for anime, chapters for manga, then the shared ones. */
  protected fun figures(d: WidgetDraw, s: JSONObject): List<Pair<String, String>> {
    val lead = if (d.settings.manga) {
      listOf(whole(s.optLong("units")) to d.label("chapters", ""), whole(s.optLong("total")) to d.label("titles", ""))
    } else {
      listOf(
        String.format(Locale.getDefault(), "%.1f", s.optLong("minutes") / 1440.0) to d.label("days", ""),
        whole(s.optLong("units")) to d.label("episodes", ""),
      )
    }
    return lead + listOf(mean(s) to d.label("meanScore", ""), whole(s.optLong("completed")) to d.label("completed", ""))
  }

  protected fun tiles(d: WidgetDraw, container: Int, layout: Int, items: List<Pair<String, String>>) {
    d.views.removeAllViews(container)
    for ((value, label) in items) {
      val tile = RemoteViews(d.context.packageName, layout)
      tile.setTextViewText(R.id.w_tile_value, value)
      tile.setTextViewText(R.id.w_tile_label, label)
      tile.setTextColor(R.id.w_tile_label, d.muted)
      d.views.addView(container, tile)
    }
  }
}

/** The seven launcher-facing types, nested so the manifest's `.Widgets$AiringToday` and friends stay one file. */
class Widgets {
  class AiringToday : FocusWidget() {
    override val home = "calendar"
    override fun titleRes() = R.string.widget_airing_title
    override fun title(d: WidgetDraw) = d.label("airingToday", d.context.getString(titleRes()))

    override fun fill(d: WidgetDraw): Boolean {
      val today = rows(d, "airing").filter { sameDay(it.optLong("airingAtMs"), d.now) }
      if (today.isEmpty()) return nothing(d)
      val ep = d.label("episode", "Ep")
      val lead = today.firstOrNull { it.optLong("airingAtMs") > d.now } ?: today.last()
      val at = lead.optLong("airingAtMs")
      val ahead = at > d.now
      d.views.setTextViewText(R.id.w_count, whole(today.size.toLong()))
      hero(
        d,
        lead.optLong("id"),
        lead.optString("title"),
        if (ahead) "${d.label("upNext", "")} · ${clock(at)}" else "${clock(at)} · ${d.label("aired", "")}",
        if (ahead) "" else "$ep ${lead.optLong("episode")}",
        if (ahead) "$ep ${lead.optLong("episode")}" else "",
        d.openTitle("anime", lead.optLong("id"), home),
      )
      d.views.setViewVisibility(R.id.w_hero_bar, View.GONE)
      if (ahead) {
        // The chronometer counts down by itself, so the hour stays right between two draws.
        d.views.setChronometer(R.id.w_hero_clock, SystemClock.elapsedRealtime() + (at - d.now), null, true)
        d.views.setChronometerCountDown(R.id.w_hero_clock, true)
        d.views.setViewVisibility(R.id.w_hero_clock, View.VISIBLE)
      } else {
        d.views.setViewVisibility(R.id.w_hero_clock, View.GONE)
      }
      rest(
        d,
        today.filter { it !== lead }.sortedBy { it.optLong("airingAtMs") <= d.now }.map {
          val time = it.optLong("airingAtMs")
          Small(it.optLong("id"), it.optString("title"), clock(time), time <= d.now)
        },
        "anime",
        home,
      )
      return true
    }
  }

  class ContinueWatching : ContinueWidget() {
    override val home = "list"
    override val currentKey = "continueWatching"
    override val planKey = "planWatching"
    override val type = "anime"
    override val unitKey = "episode"
    override val unitFallback = "Ep"
    override fun titleRes() = R.string.widget_watching_title
    override fun title(d: WidgetDraw) = d.label("continueWatching", d.context.getString(titleRes()))
  }

  class ContinueReading : ContinueWidget() {
    override val home = "manga"
    override val currentKey = "continueReading"
    override val planKey = "planReading"
    override val type = "manga"
    override val unitKey = "chapter"
    override val unitFallback = "Ch"
    override fun titleRes() = R.string.widget_reading_title
    override fun title(d: WidgetDraw) = d.label("continueReading", d.context.getString(titleRes()))
  }

  /** Seven columns from today on, each day's covers stacked with the hour under them. */
  class Week : KarasuWidgetBase() {
    override val layout = R.layout.karasu_widget_week
    override val home = "calendar"
    override fun titleRes() = R.string.widget_week_title
    override fun title(d: WidgetDraw) = d.label("week", d.context.getString(titleRes()))

    override fun fill(d: WidgetDraw): Boolean {
      val coming = rows(d, "airing").filter { it.optLong("airingAtMs") >= d.now - 60L * 60 * 1000 }
      val days = d.doc.optJSONArray("days")
      val column = ((d.widthDp - 28) / 7f - 8f).coerceAtLeast(20f)
      val perItem = column * 1.5f + 17f
      val room = ((d.heightDp - 36) / perItem).toInt().coerceIn(1, 3)
      val start = Calendar.getInstance().apply { timeInMillis = d.now }
      d.views.removeAllViews(R.id.w_week)
      var shown = 0
      for (offset in 0 until 7) {
        val day = (start.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, offset) }.timeInMillis
        val entries = coming.filter { sameDay(it.optLong("airingAtMs"), day) }
        shown += entries.size
        val col = RemoteViews(d.context.packageName, R.layout.karasu_widget_day)
        val name = days?.optString(dayIndex(day)) ?: ""
        col.setTextViewText(R.id.w_day_name, if (entries.size > room) "$name +${entries.size - room}" else name)
        col.setTextColor(R.id.w_day_name, if (offset == 0) d.accent else d.muted)
        if (offset == 0) col.setInt(R.id.w_day, "setBackgroundResource", R.drawable.karasu_widget_today)
        for (entry in entries.take(room)) {
          val item = RemoteViews(d.context.packageName, R.layout.karasu_widget_day_item)
          val id = entry.optLong("id")
          item.setImageViewBitmap(R.id.w_item_cover, WidgetArt.cover(d, id, entry.optString("title"), column, column * 1.5f))
          item.setTextViewText(R.id.w_item_sub, clock(entry.optLong("airingAtMs")))
          item.setOnClickPendingIntent(R.id.w_day_item, d.openTitle("anime", id, home))
          col.addView(R.id.w_day_items, item)
        }
        d.views.addView(R.id.w_week, col)
      }
      d.views.setTextViewText(R.id.w_count, if (shown > 0) whole(shown.toLong()) else "")
      return shown > 0
    }
  }

  /** Four figures as tiles over the list's statuses as one bar. */
  class Figures : StatsWidget() {
    override val layout = R.layout.karasu_widget_figures

    override fun fill(d: WidgetDraw): Boolean {
      val s = stats(d)
      val all = figures(d, s)
      val narrow = d.widthDp < 200
      d.views.setTextViewText(R.id.w_count, if (narrow) "" else whole(s.optLong("total")))
      // Short of room for two rows of tiles, the four figures stand in one row without their frames.
      val tall = d.heightDp >= 210
      val wide = !narrow && !d.settings.compact
      when {
        narrow -> {
          tiles(d, R.id.w_tiles_a, R.layout.karasu_widget_tile, all.take(1))
          tiles(d, R.id.w_tiles_b, R.layout.karasu_widget_tile, all.drop(2).take(1))
        }
        tall || !wide -> {
          tiles(d, R.id.w_tiles_a, R.layout.karasu_widget_tile, all.take(2))
          tiles(d, R.id.w_tiles_b, R.layout.karasu_widget_tile, all.drop(2))
        }
        else -> {
          tiles(d, R.id.w_tiles_a, R.layout.karasu_widget_stat, all)
          d.views.removeAllViews(R.id.w_tiles_b)
        }
      }
      d.views.setViewVisibility(R.id.w_chart, if (wide) View.VISIBLE else View.GONE)
      d.views.setViewVisibility(R.id.w_legend, if (wide) View.VISIBLE else View.GONE)
      if (wide) {
        val values = statuses(s)
        val colours = statusColours(d)
        d.views.setImageViewBitmap(R.id.w_chart, WidgetArt.segments(d, values, colours))
        val legend = SpannableStringBuilder()
        for ((i, key) in statusKeys.withIndex()) {
          if (values[i] <= 0L) continue
          if (legend.isNotEmpty()) legend.append("   ")
          val from = legend.length
          // No-break spaces keep a square, its name and its number on one line.
          legend.append("■\u00A0")
          legend.setSpan(ForegroundColorSpan(colours[i]), from, from + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
          legend.append("${d.label(key, "")}\u00A0${whole(values[i])}".replace(' ', '\u00A0'))
        }
        d.views.setTextViewText(R.id.w_legend, legend)
      }
      return s.optLong("total") > 0L
    }
  }

  /** The list's statuses as a ring around the number of titles, the figures beside it. */
  class Ring : StatsWidget() {
    override val layout = R.layout.karasu_widget_ring

    override fun fill(d: WidgetDraw): Boolean {
      val s = stats(d)
      val narrow = d.widthDp < 200
      val size = minOf(d.heightDp - 52f, if (narrow) d.widthDp - 28f else (d.widthDp - 42f) * 0.4f).coerceIn(48f, 160f)
      d.views.setImageViewBitmap(
        R.id.w_chart,
        WidgetArt.ring(d, statuses(s), statusColours(d), whole(s.optLong("total")), d.label("titles", ""), size),
      )
      d.views.setViewVisibility(R.id.w_facts, if (narrow) View.GONE else View.VISIBLE)
      if (!narrow) tiles(d, R.id.w_facts, R.layout.karasu_widget_fact, figures(d, s))
      d.views.setTextViewText(R.id.w_count, "")
      return s.optLong("total") > 0L
    }
  }

  /** What was completed this year, month by month, over three running figures. */
  class Year : StatsWidget() {
    override val layout = R.layout.karasu_widget_year

    override fun fill(d: WidgetDraw): Boolean {
      val s = stats(d)
      val months = s.optJSONArray("months")
      val values = LongArray(12) { months?.optLong(it) ?: 0L }
      val year = s.optLong("year")
      val narrow = d.widthDp < 200
      d.views.setTextViewText(R.id.w_hero_big, whole(values.sum()))
      d.views.setTextViewText(R.id.w_hero_sub, d.label("completedInYear", "").replace("{{year}}", year.toString()))
      d.views.setTextColor(R.id.w_hero_sub, d.muted)
      val current = Calendar.getInstance().let { if (it.get(Calendar.YEAR).toLong() == year) it.get(Calendar.MONTH) else -1 }
      val foot = !narrow && !d.settings.compact && d.heightDp >= 135
      val chartHeight = (d.heightDp - (if (foot) 118f else 76f)).coerceIn(24f, 120f)
      d.views.setImageViewBitmap(R.id.w_chart, WidgetArt.months(d, values, current, d.widthDp - 28f, chartHeight))
      d.views.setViewVisibility(R.id.w_tiles_a, if (foot) View.VISIBLE else View.GONE)
      if (foot) {
        val all = figures(d, s)
        tiles(d, R.id.w_tiles_a, R.layout.karasu_widget_stat, listOf(all[0], all[2], whole(s.optLong("current")) to d.label("current", "")))
      }
      d.views.setTextViewText(R.id.w_count, "")
      return s.optLong("total") > 0L
    }
  }
}
