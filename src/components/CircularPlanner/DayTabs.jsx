import { MAX_DAYS, WEEKDAYS, getWeekday } from '../../constants/planner'

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
 */
export default function DayTabs({
  days,
  activeDayId,
  availableWeekdays,
  onSelectDay,
  onAddDay,
  onRemoveDay,
  onChangeWeekday,
}) {
  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0]

  return (
    <div className="day-tabs">
      <div className="day-tabs__list" role="tablist" aria-label="days">
        {days.map((day) => {
          const meta = getWeekday(day.weekdayId)
          return (
            <button
              key={day.id}
              type="button"
              role="tab"
              aria-selected={day.id === activeDay.id}
              className={
                day.id === activeDay.id
                  ? 'day-tabs__tab is-active'
                  : 'day-tabs__tab'
              }
              title={meta.label}
              onClick={() => onSelectDay(day.id)}
            >
              {meta.label}
            </button>
          )
        })}

        {days.length < MAX_DAYS && availableWeekdays.length > 0 && (
          <button
            type="button"
            className="day-tabs__tab day-tabs__tab--add"
            aria-label="add day"
            title="add day"
            onClick={() => onAddDay()}
          >
            <IconPlus />
          </button>
        )}

        {days.length > 1 && (
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

      <label className="day-tabs__weekday">
        <span className="visually-hidden">weekday</span>
        <select
          value={activeDay.weekdayId}
          aria-label="weekday"
          onChange={(event) =>
            onChangeWeekday(activeDay.id, event.target.value)
          }
        >
          {WEEKDAYS.map((weekday) => {
            const taken = days.some(
              (day) =>
                day.weekdayId === weekday.id && day.id !== activeDay.id,
            )
            return (
              <option
                key={weekday.id}
                value={weekday.id}
                disabled={taken}
              >
                {weekday.label}
              </option>
            )
          })}
        </select>
      </label>
    </div>
  )
}
