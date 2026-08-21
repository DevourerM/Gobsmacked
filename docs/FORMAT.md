# Gobsmacked Record 格式规范（V1）

记录文件使用 `.gob` 扩展名，UTF-8 编码。它是一个严格、可迁移、可版本升级的结构化文档，而非以换行约定分段的纯文本。

```json
{
  "schema": "cn.dxr.gobsmacked-record",
  "version": 1,
  "id": "day:2026-08-20",
  "kind": "day",
  "date": "2026-08-20",
  "title": "2026年8月20日",
  "tags": ["木曜日"],
  "location": { "name": "自定义地点", "latitude": 32.0, "longitude": 118.0 },
  "blocks": [
    {
      "id": "…",
      "type": "paragraph",
      "text": "窗外下起了雨。",
      "voices": [
        { "id": "…", "assetId": "…", "fileName": "…webm", "label": "雨声", "offset": 2, "durationMs": 2750 }
      ],
      "images": [
        { "id": "…", "assetId": "…", "fileName": "…png", "label": "窗外", "offset": 8 }
      ]
    }
  ],
  "createdAt": "2026-08-20T12:00:00.000Z",
  "updatedAt": "2026-08-20T12:00:00.000Z"
}
```

## 不变量

- `kind=day` 时 `date` 必须为 `YYYY-MM-DD`；`kind=year` 时必须为四位年份。
- 文档引用媒体资源 ID，不保存任意外部绝对路径。
- `paragraph.voices` 保存文本内录音引用；`offset` 是标签所在的文本字符位置，`durationMs` 用于稳定显示圆形播放进度，标签本身不混入正文，界面显示为可点击的 `〘标签〙`。
- `paragraph.images` 保存文本内图片引用；它同样以可点击标签显示，先打开小预览，再由预览进入全屏查看。
- 旧版独立 `audio` / `image` 块仍可读取并显示为标签；新媒体统一保存为段落内引用。
- `location.name` 是地点的唯一必需字段；经纬度只在用户主动联网定位成功后作为内部可选字段保存，界面不直接展示。
- 未识别的块必须原样保留；低版本客户端不得悄悄删除新字段。
- 写入使用同目录临时文件 + 原子替换。
- 导出包中的 `checksums.json` 使用 SHA-256 记录文件完整性。

## 资料库目录

```text
vault/
  records/day/2026/2026-08-20.gob
  records/year/2026.gob
  assets/<asset-id>.<ext>
  metadata/annotations.json
  metadata/constellation.json
  metadata/events.json
  manifest.json
```

V2 计划加入单文档自包含容器、加密头、媒体去重和修订历史；V1 的 `schema/version` 可确保迁移器可靠识别。
