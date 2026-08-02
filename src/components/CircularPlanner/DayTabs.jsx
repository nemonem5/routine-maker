import { MAX_DAYS, WEEKDAYS, getWeekday } from '../../constants/planner'

function dayLabel(day) {
  if (day.weekdayId) return getWeekday(day.weekdayId).label
  return day.label?.trim() || '이름없음'
}

function IconPlus() {
  return (
    <svg
      className="day-tabs__icon"
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

function IconClose() {
  return (
    <svg
      className="day-tabs__icon"
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

/**
 * Compact weekday switcher for the right sidebar.
 * In wallpaper mode, tabs toggle inclusion on the board (multi-select).
 */
const CUSTOM_OPTION_VALUE = '__custom__'

export default function DayTabs({
  days,
  activeDayId,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  onChangeWeekday,
  onRenameDay,
  multiSelect = false,
  selectedDayIds = [],
  onToggleDay,
}) {
  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0]
  const selectedSet = new Set(selectedDayIds)

  return (
    <div className="day-tabs">
      <div className="day-tabs__list" role="tablist" aria-label="days">
        {days.map((day) => {
          const label = dayLabel(day)
          const isOn =
            multiSelect ? selectedSet.has(day.id) : day.id === activeDay.id
          return (
            <button
              key={day.id}
              type="button"
              role="tab"
              aria-selected={isOn}
              className={isOn ? 'day-tabs__tab is-active' : 'day-tabs__tab'}
              title={
                multiSelect
                  ? selectedSet.has(day.id)
                    ? `${label} 제외`
                    : `${label} 포함`
                  : label
              }
              onClick={() =>
                multiSelect ? onToggleDay?.(day.id) : onSelectDay(day.id)
              }
            >
              {label}
            </button>
          )
        })}

        {!multiSelect && days.length < MAX_DAYS && (
          <button
            type="button"
            className="day-tabs__tab day-tabs__tab--add"
            aria-label="add day"
            title="시간표 추가"
            onClick={() => onAddDay()}
          >
            <IconPlus />
          </button>
        )}

        {!multiSelect && days.length > 1 && (
          <button
            type="button"
            className="day-tabs__remove"
            aria-label="remove day"
            title="remove day"
            onClick={() => onRemoveDay(activeDay.id)}
          >
            <IconClose />
          </button>
        )}
      </div>

      {!multiSelect && (
        <>
          <label className="day-tabs__weekday">
            <span className="visually-hidden">weekday</span>
            <select
              value={activeDay.weekdayId ?? CUSTOM_OPTION_VALUE}
              aria-label="weekday"
              onChange={(event) => {
                const value = event.target.value
                onChangeWeekday(
                  activeDay.id,
                  value === CUSTOM_OPTION_VALUE ? null : value,
                )
              }}
            >
              {WEEKDAYS.map((weekday) => {
                const taken = days.some(
                  (day) =>
                    day.weekdayId === weekday.id && day.id !== activeDay.id,
                )
                return (
                  <option key={weekday.id} value={weekday.id} disabled={taken}>
                    {weekday.label}
                  </option>
                )
              })}
              <option value={CUSTOM_OPTION_VALUE}>직접 입력</option>
            </select>
          </label>

          {activeDay.weekdayId == null && (
            <input
              key={activeDay.id}
              type="text"
              className="day-tabs__custom-name"
              defaultValue={activeDay.label ?? ''}
              placeholder="이름 (예: 여행)"
              maxLength={12}
              aria-label="custom day name"
              onBlur={(event) => onRenameDay?.(activeDay.id, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
