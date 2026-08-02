import { useEffect, useRef, useState } from 'react'
import { TOOLS } from '../../constants/planner'
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
      <path d="M14.7 4.3 19.7 9.3" />
      <path d="m4 20 5.2-1.1L19.4 8.7a2.1 2.1 0 0 0-3-3L6.1 16.1 4 20Z" />
      <path d="M12.8 6.8 17.2 11.2" />
    </svg>
  )
}

function IconErase() {
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
      <path d="m7 17-3-3 8.5-8.5a2.1 2.1 0 0 1 3 0L19 9a2.1 2.1 0 0 1 0 3l-7 7H7Z" />
      <path d="M5 20h14" />
      <path d="m9.5 9.5 5 5" />
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

function IconMinus() {
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
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m8 16 3-3 2 2 3-4 3 5" />
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
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M12 4v12" />
      <path d="m7 9 5 5 5-5" />
    </svg>
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
  availableWeekdays,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  onChangeWeekday,
  customBackgroundSrc,
  onSetCustomBackground,
  onClearCustomBackground,
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
  selectedStickerId,
  onDeleteSelected,
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

  return (
    <aside className="planner-toolbar">
      <DayTabs
        days={days}
        activeDayId={activeDayId}
        availableWeekdays={availableWeekdays}
        onSelectDay={onSelectDay}
        onAddDay={onAddDay}
        onRemoveDay={onRemoveDay}
        onChangeWeekday={onChangeWeekday}
      />

      <div className="planner-toolbar__tools" role="group" aria-label="도구">
        <button
          type="button"
          className={
            tool === TOOLS.paint
              ? 'planner-toolbar__btn is-active'
              : 'planner-toolbar__btn'
          }
          aria-label="색칠"
          title="색칠"
          onClick={() => onToolChange(TOOLS.paint)}
        >
          <IconPaint />
        </button>
        <button
          type="button"
          className={
            tool === TOOLS.sticker
              ? 'planner-toolbar__btn is-active'
              : 'planner-toolbar__btn'
          }
          aria-label="스티커"
          title="스티커"
          onClick={() => onToolChange(TOOLS.sticker)}
        >
          <IconSticker />
        </button>
        <button
          type="button"
          className={
            tool === TOOLS.erase
              ? 'planner-toolbar__btn is-active'
              : 'planner-toolbar__btn'
          }
          aria-label="지우기"
          title="지우기"
          onClick={() => onToolChange(TOOLS.erase)}
        >
          <IconErase />
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

      <div className="planner-toolbar__customize" role="group" aria-label="파일">
        <button
          type="button"
          className="planner-toolbar__btn"
          aria-label="저장"
          title="저장"
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
            customBackgroundSrc
              ? 'planner-toolbar__btn is-active'
              : 'planner-toolbar__btn'
          }
          aria-label="배경 이미지"
          title="배경 이미지"
          onClick={() => bgRef.current?.click()}
        >
          <IconImage />
        </button>
        {customBackgroundSrc && (
          <button
            type="button"
            className="planner-toolbar__btn planner-toolbar__btn--ghost"
            aria-label="배경 초기화"
            title="배경 초기화"
            onClick={onClearCustomBackground}
          >
            <IconClose />
          </button>
        )}
      </div>

      {tool === TOOLS.paint && (
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

      {tool === TOOLS.sticker && (
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

          {selectedStickerId && (
            <div className="planner-toolbar__sticker-actions">
              <button
                type="button"
                className="planner-toolbar__btn planner-toolbar__btn--ghost"
                aria-label="배치된 스티커 삭제"
                title="배치된 스티커 삭제"
                onClick={onDeleteSelected}
              >
                <IconTrash />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
