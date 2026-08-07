import { useEffect, useRef, useState } from 'react'
import { APP_MODES, ARTBOARD_PRESETS, TOOLS } from '../../constants/planner'
import DayTabs from './DayTabs'
import { STICKER_DRAG_MIME } from './PlannerCanvas'

function IconPaint() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.2c2.6 3.3 5.6 7.2 5.6 10.4a5.6 5.6 0 1 1-11.2 0c0-3.2 3-7.1 5.6-10.4Z" />
    </svg>
  )
}

function IconSticker() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3.2 14.2 9.1l6.3.5-4.8 4.1 1.5 6.1L12 16.7 6.8 19.8l1.5-6.1-4.8-4.1 6.3-.5L12 3.2Z" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M7 7 17 17" />
      <path d="M17 7 7 17" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8h14" />
      <path d="M9 8V6h6v2" />
      <path d="M7 8v11h10V8" />
    </svg>
  )
}

function IconOpacity() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M12 3c3.5 4 6 7.2 6 10a6 6 0 1 1-12 0c0-2.8 2.5-6 6-10Z"
        fillOpacity="0.35"
        fill="currentColor"
      />
    </svg>
  )
}

function IconSparkle({ color }) {
  return (
    <svg
      className="planner-toolbar__sparkle"
      viewBox="0 0 24 28"
      aria-hidden="true"
    >
      <path
        fill={color}
        d="M12 1c.4 6.8 2.6 10.2 7.2 11.5C14.6 13.8 12.4 17.2 12 24c-.4-6.8-2.6-10.2-7.2-11.5C9.4 11.2 11.6 7.8 12 1Z"
      />
    </svg>
  )
}

function IconImage() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7.5h12.5A1.5 1.5 0 0 1 18 9v9.5A1.5 1.5 0 0 1 16.5 20H4.5A1.5 1.5 0 0 1 3 18.5v-9A2 2 0 0 1 5 7.5Z" />
      <path d="M7 7.5V5.5A1.5 1.5 0 0 1 8.5 4H20a1 1 0 0 1 1 1v11.5A1.5 1.5 0 0 1 19.5 18H18" />
      <circle cx="8.2" cy="12" r="1.2" />
      <path d="m6.5 17.5 2.6-2.4 1.7 1.5 2.4-2.8 2.8 3.7" />
    </svg>
  )
}

function IconSave() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 5h11l3 3v11H5V5Z" />
      <path d="M8 5v5h8V5" />
      <path d="M8 19v-6h8v6" />
    </svg>
  )
}

function IconLoad() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V11a1.5 1.5 0 0 0-1.5-1.5H12l-2-2.2H4.5A1.5 1.5 0 0 0 3 9.5Z" />
      <path d="M3 14.5h18" />
    </svg>
  )
}

function IconHelp() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.2.9-1.2 1.7" />
      <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Shape hints for the artboard-preset buttons, replacing the Korean text
 * labels (세로/와이드/정사각/지정) with a plain visual read of what each
 * preset actually does: a tall rect, a wide rect, a square, or a "+" for
 * "type your own numbers".
 */
function IconAspectShape({ presetId }) {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {presetId === 'phone' && <rect x="8" y="3" width="8" height="18" rx="1.5" />}
      {presetId === 'desktop' && <rect x="3" y="8" width="18" height="8" rx="1.5" />}
      {presetId === 'square' && <rect x="5" y="5" width="14" height="14" rx="1.5" />}
      {presetId === 'custom' && (
        <>
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </>
      )}
    </svg>
  )
}

function IconTransparentBg() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3 12h9M12 3v9M12 12h9M12 12v9"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.55"
      />
    </svg>
  )
}

function IconAutoLayout() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconExportPng() {
  return (
    <svg
      className="planner-toolbar__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v10" />
      <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
      <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" />
    </svg>
  )
}

const TUTORIAL_STEPS = [
  {
    title: '요일 만들기',
    body: '위쪽 탭으로 스케줄을 고르고, +로 새 날을 추가해요. 이름도 바꿀 수 있어요.',
  },
  {
    title: '색칠하기',
    body: '물방울 버튼을 누른 뒤 원을 클릭·드래그해서 시간을 칠해요. 더블클릭하면 지워져요.',
  },
  {
    title: '스티커',
    body: '별 버튼에서 스티커를 고르고 원에 놓아요. Ctrl+C / Ctrl+V로 복사·붙여넣기할 수 있어요.',
  },
  {
    title: '배경',
    body: '이미지 버튼으로 배경 사진을 넣고 크기·투명도를 조절해요.',
  },
  {
    title: '배치 모드',
    body: '오른쪽 눈 아래 배치 아이콘으로 여러 요일을 한 화면에 모은 뒤 PNG로 저장해요.',
  },
  {
    title: '실행 취소',
    body: 'Ctrl+Z로 되돌리고, Ctrl+Y(또는 Ctrl+Shift+Z)로 다시 앞으로 갈 수 있어요.',
  },
]

export function TutorialOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="planner-tutorial"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planner-tutorial-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div className="planner-tutorial__card">
        <div className="planner-tutorial__header">
          <h2 id="planner-tutorial-title" className="planner-tutorial__title">
            사용법 안내
          </h2>
          <button
            type="button"
            className="planner-tutorial__close"
            aria-label="닫기"
            title="닫기"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </div>
        <ol className="planner-tutorial__list">
          {TUTORIAL_STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="planner-tutorial__step" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <strong>{step.title}</strong>
                {step.body}
              </div>
            </li>
          ))}
        </ol>
        <p className="planner-tutorial__foot">
          사이드바 맨 위 가로 막대를 드래그하면 패널만 원하는 위치로 옮길 수 있어요.
          더블클릭하면 원래 자리로 돌아가요.
        </p>
      </div>
    </div>
  )
}

export default function PlannerToolbar({
  tool,
  onToolChange,
  themes,
  themeId,
  onThemeChange,
  colors,
  selectedColor,
  onColorChange,
  rangeStart,
  onCancelRange,
  days,
  activeDayId,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  onChangeWeekday,
  onRenameDay,
  customBackgroundSrc,
  bgEditMode,
  onEnterBgEdit,
  onSetCustomBackground,
  backgroundOpacity = 1,
  onBackgroundOpacityChange,
  onClearBackground,
  onSaveProject,
  onLoadProjectFile,
  stickerCategories,
  activeCategoryId,
  onActiveCategoryChange,
  onAddCategory,
  onRemoveCategory,
  onRenameCategory,
  stickerLibrary,
  pendingStickerSrc,
  onSelectLibrarySticker,
  onAddStickers,
  onRemoveLibraryItem,
  selectedStickerIds = [],
  onDeleteSelected,
  appMode,
  wallpaperDayIds = [],
  onToggleWallpaperDay,
  onAutoArrangeWallpaper,
  artboardPresetId,
  onArtboardPresetChange,
  customAspectW,
  customAspectH,
  onCustomAspectChange,
  onExportWallpaperPng,
  transparentExport = false,
  onToggleTransparentExport,
  onToolbarDragPointerDown,
  onToolbarDragPointerMove,
  onToolbarDragPointerUp,
  onToolbarDragDoubleClick,
  toolbarWrapRef,
  toolbarDragging = false,
  onOpenTutorial,
}) {
  const fileRef = useRef(null)
  const bgRef = useRef(null)
  const loadRef = useRef(null)
  const activeCategory =
    stickerCategories.find((category) => category.id === activeCategoryId) ??
    stickerCategories[0]
  const [categoryDraft, setCategoryDraft] = useState(activeCategory?.name ?? '')

  useEffect(() => {
    setCategoryDraft(activeCategory?.name ?? '')
  }, [activeCategory?.id, activeCategory?.name])

  const isWallpaper = appMode === APP_MODES.wallpaper

  return (
    <div
      ref={toolbarWrapRef}
      className={
        toolbarDragging
          ? 'planner-toolbar-wrap is-dragging'
          : 'planner-toolbar-wrap'
      }
    >
    <aside className="planner-toolbar">
      <button
        type="button"
        className="planner-toolbar__drag"
        aria-label="사이드바 이동"
        title="드래그해서 이동 · 더블클릭으로 원래 자리"
        onPointerDown={onToolbarDragPointerDown}
        onPointerMove={onToolbarDragPointerMove}
        onPointerUp={onToolbarDragPointerUp}
        onPointerCancel={onToolbarDragPointerUp}
        onDoubleClick={onToolbarDragDoubleClick}
      >
        <span className="planner-toolbar__drag-bars" aria-hidden="true" />
      </button>

      {/* 1) Day create / select / delete */}
      <div className="planner-toolbar__section">
        <DayTabs
          days={days}
          activeDayId={activeDayId}
          onSelectDay={onSelectDay}
          onAddDay={onAddDay}
          onRemoveDay={onRemoveDay}
          onChangeWeekday={onChangeWeekday}
          onRenameDay={onRenameDay}
          multiSelect={isWallpaper}
          selectedDayIds={wallpaperDayIds}
          onToggleDay={onToggleWallpaperDay}
        />
      </div>

      {isWallpaper ? (
        <>
        {/* 2) Aspect ratio */}
        <div className="planner-toolbar__section planner-toolbar__section--divided">
          <div className="planner-toolbar__presets" role="group" aria-label="화면 비율">
            {Object.values(ARTBOARD_PRESETS).map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={
                  artboardPresetId === preset.id
                    ? 'planner-toolbar__preset is-active'
                    : 'planner-toolbar__preset'
                }
                aria-label={preset.label}
                title={preset.label}
                onClick={() => onArtboardPresetChange?.(preset.id)}
              >
                <IconAspectShape presetId={preset.id} />
              </button>
            ))}
          </div>
          {artboardPresetId === 'custom' && (
            <div
              className="planner-toolbar__aspect-inputs"
              role="group"
              aria-label="사용자 지정 비율"
            >
              <input
                type="number"
                min={1}
                max={99}
                step={1}
                value={customAspectW}
                aria-label="가로 비율"
                title="가로"
                onChange={(event) =>
                  onCustomAspectChange?.(
                    Number(event.target.value),
                    customAspectH,
                  )
                }
              />
              <span aria-hidden="true">:</span>
              <input
                type="number"
                min={1}
                max={99}
                step={1}
                value={customAspectH}
                aria-label="세로 비율"
                title="세로"
                onChange={(event) =>
                  onCustomAspectChange?.(
                    customAspectW,
                    Number(event.target.value),
                  )
                }
              />
            </div>
          )}
        </div>

        {/* 3) Arrange + high-res download only (save/load live in edit mode) */}
        <div
          className="planner-toolbar__section planner-toolbar__section--divided"
          role="group"
          aria-label="내보내기"
        >
          <div className="planner-toolbar__customize">
            <button
              type="button"
              className="planner-toolbar__btn"
              aria-label="자동 배열"
              title="자동 배열"
              onClick={() => onAutoArrangeWallpaper?.()}
            >
              <IconAutoLayout />
            </button>
            <button
              type="button"
              className={
                transparentExport
                  ? 'planner-toolbar__btn is-active'
                  : 'planner-toolbar__btn'
              }
              aria-label="투명 배경으로 내보내기"
              aria-pressed={transparentExport}
              title="투명 배경으로 내보내기"
              onClick={() => onToggleTransparentExport?.()}
            >
              <IconTransparentBg />
            </button>
            <button
              type="button"
              className="planner-toolbar__btn"
              aria-label="고화질 PNG 저장"
              title="고화질 PNG 저장"
              onClick={() => onExportWallpaperPng?.()}
            >
              <IconExportPng />
            </button>
          </div>
        </div>
        </>
      ) : (
        <>
      {/* 2) Edit tools + contextual panels */}
      <div className="planner-toolbar__section planner-toolbar__section--divided">
      <div className="planner-toolbar__tools" role="group" aria-label="도구">
        <button
          type="button"
          className={
            tool === TOOLS.paint && !bgEditMode
              ? 'planner-toolbar__btn is-active'
              : 'planner-toolbar__btn'
          }
          aria-label="색칠"
          title="색칠 (더블클릭으로 지우기)"
          onClick={() => onToolChange(TOOLS.paint)}
        >
          <IconPaint />
        </button>
        <button
          type="button"
          className={
            tool === TOOLS.sticker && !bgEditMode
              ? 'planner-toolbar__btn is-active'
              : 'planner-toolbar__btn'
          }
          aria-label="스티커"
          title="스티커"
          onClick={() => onToolChange(TOOLS.sticker)}
        >
          <IconSticker />
        </button>
        <input
          ref={bgRef}
          className="visually-hidden"
          type="file"
          accept="image/png,image/webp,image/jpeg,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onSetCustomBackground?.(file)
            event.target.value = ''
          }}
        />
        <button
          type="button"
          className={
            bgEditMode
              ? 'planner-toolbar__btn is-active'
              : 'planner-toolbar__btn'
          }
          aria-label="배경 편집"
          title="배경 편집"
          onClick={() => {
            if (bgEditMode) {
              bgRef.current?.click()
              return
            }
            onEnterBgEdit?.()
            if (!customBackgroundSrc) bgRef.current?.click()
          }}
        >
          <IconImage />
        </button>
        {rangeStart != null && (
          <button
            type="button"
            className="planner-toolbar__btn planner-toolbar__btn--ghost"
            aria-label="선택 취소"
            title="선택 취소"
            onClick={onCancelRange}
          >
            <IconClose />
          </button>
        )}
      </div>

      {tool === TOOLS.paint && !bgEditMode && (
        <div className="planner-toolbar__panel">
          <div
            className="planner-toolbar__themes"
            role="group"
            aria-label="색상 팔레트"
          >
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={
                  themeId === theme.id
                    ? 'planner-toolbar__theme is-active'
                    : 'planner-toolbar__theme'
                }
                aria-label={theme.label}
                title={theme.label}
                onClick={() => onThemeChange(theme.id)}
              >
                <IconSparkle color={theme.accent ?? theme.colors[6]} />
              </button>
            ))}
          </div>

          <div
            className="planner-toolbar__swatches"
            role="listbox"
            aria-label="색상"
          >
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                role="option"
                aria-label={color}
                aria-selected={selectedColor === color}
                className={
                  selectedColor === color
                    ? 'planner-toolbar__swatch is-active'
                    : 'planner-toolbar__swatch'
                }
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {tool === TOOLS.sticker && !bgEditMode && (
        <div className="planner-toolbar__panel planner-toolbar__stickers">
          <div className="sticker-categories" role="tablist" aria-label="스티커 카테고리">
            {stickerCategories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={category.id === activeCategoryId}
                className={
                  category.id === activeCategoryId
                    ? 'sticker-categories__tab is-active'
                    : 'sticker-categories__tab'
                }
                title={category.name || `set ${index + 1}`}
                onClick={() => onActiveCategoryChange?.(category.id)}
              >
                {typeof category.name === 'string' && category.name.trim()
                  ? category.name.trim().slice(0, 6)
                  : index + 1}
              </button>
            ))}
            <button
              type="button"
              className="sticker-categories__tab sticker-categories__tab--add"
              aria-label="카테고리 추가"
              title="카테고리 추가"
              onClick={() => onAddCategory?.()}
            >
              <IconPlus />
            </button>
            {stickerCategories.length > 1 && (
              <button
                type="button"
                className="sticker-categories__tab sticker-categories__tab--danger"
                aria-label="현재 카테고리 삭제"
                title="현재 카테고리 삭제"
                onClick={() => onRemoveCategory?.(activeCategoryId)}
              >
                <IconTrash />
              </button>
            )}
          </div>

          <div className="sticker-container">
            <div className="sticker-container__toolbar">
              <input
                className="sticker-container__name"
                type="text"
                value={categoryDraft}
                placeholder="name"
                maxLength={20}
                aria-label="카테고리 이름"
                onChange={(event) => setCategoryDraft(event.target.value)}
                onBlur={() =>
                  onRenameCategory?.(activeCategoryId, categoryDraft.trim())
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
              />
              <input
                ref={fileRef}
                className="visually-hidden"
                type="file"
                accept="image/png,image/webp,image/gif,image/jpeg"
                multiple
                onChange={(event) => {
                  const files = event.target.files
                  if (files?.length) onAddStickers?.(files)
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                className="planner-toolbar__btn planner-toolbar__btn--compact"
                aria-label="스티커 불러오기"
                title="스티커 불러오기"
                onClick={() => fileRef.current?.click()}
              >
                <IconPlus />
              </button>
            </div>

            <div
              className="sticker-container__grid"
              role="listbox"
              aria-label="스티커"
            >
              {stickerLibrary.map((item) => (
                <div
                  key={item.id}
                  className={
                    pendingStickerSrc === item.src
                      ? 'sticker-container__item is-active'
                      : 'sticker-container__item'
                  }
                >
                  <button
                    type="button"
                    role="option"
                    aria-label={item.name}
                    aria-selected={pendingStickerSrc === item.src}
                    title={item.name}
                    className="sticker-container__pick"
                    draggable
                    onClick={() => onSelectLibrarySticker?.(item.src)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(STICKER_DRAG_MIME, item.src)
                      event.dataTransfer.effectAllowed = 'copy'
                      onSelectLibrarySticker?.(item.src)
                      onToolChange?.(TOOLS.sticker)
                    }}
                  >
                    <img src={item.src} alt="" draggable={false} />
                  </button>
                  <button
                    type="button"
                    className="sticker-container__remove"
                    aria-label={`${item.name} 삭제`}
                    title="등록 스티커 삭제"
                    onClick={() => onRemoveLibraryItem?.(item.id)}
                  >
                    <IconClose />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedStickerIds.length > 0 && (
            <div className="planner-toolbar__sticker-actions">
              <button
                type="button"
                className="planner-toolbar__btn planner-toolbar__btn--ghost"
                aria-label="선택한 스티커 삭제"
                title={
                  selectedStickerIds.length > 1
                    ? `선택한 스티커 ${selectedStickerIds.length}개 삭제`
                    : '배치된 스티커 삭제'
                }
                onClick={onDeleteSelected}
              >
                <IconTrash />
              </button>
            </div>
          )}
        </div>
      )}

      {bgEditMode && (
        <div className="planner-toolbar__panel">
          <div className="planner-toolbar__bg-row">
            <label className="planner-toolbar__opacity" title="배경 투명도">
              <IconOpacity />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(backgroundOpacity * 100)}
                aria-label="배경 투명도"
                disabled={!customBackgroundSrc}
                onChange={(event) =>
                  onBackgroundOpacityChange?.(Number(event.target.value) / 100)
                }
              />
            </label>
            <button
              type="button"
              className="planner-toolbar__btn planner-toolbar__btn--ghost"
              aria-label="배경 삭제"
              title="배경 삭제"
              disabled={!customBackgroundSrc}
              onClick={onClearBackground}
            >
              <IconClose />
            </button>
          </div>
          {!customBackgroundSrc && (
            <p className="planner-toolbar__hint">이미지를 선택해 배경으로 사용하세요.</p>
          )}
        </div>
      )}
      </div>

      {/* 3) Save / load — always at the bottom of edit mode */}
      <div
        className="planner-toolbar__section planner-toolbar__section--divided planner-toolbar__file"
        role="group"
        aria-label="저장"
      >
        <button
          type="button"
          className="planner-toolbar__btn"
          aria-label="저장"
          title="프로젝트 저장"
          onClick={onSaveProject}
        >
          <IconSave />
        </button>
        <input
          ref={loadRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (file) {
              try {
                await onLoadProjectFile?.(file)
              } catch {
                // ignore invalid files for now
              }
            }
            event.target.value = ''
          }}
        />
        <button
          type="button"
          className="planner-toolbar__btn"
          aria-label="불러오기"
          title="불러오기"
          onClick={() => loadRef.current?.click()}
        >
          <IconLoad />
        </button>
        <button
          type="button"
          className="planner-toolbar__btn"
          aria-label="사용법 안내"
          title="사용법 안내"
          onClick={() => onOpenTutorial?.()}
        >
          <IconHelp />
        </button>
      </div>
        </>
      )}
    </aside>
    </div>
  )
}
