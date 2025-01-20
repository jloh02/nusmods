import * as React from 'react';
import { flattenDeep, noop, values } from 'lodash';
import classnames from 'classnames';

import {
  ColoredLesson,
  HoverLesson,
  ModifiableLesson,
  TimetableArrangement,
} from 'types/timetables';
import { OnModifyCell } from 'types/views';

import {
  calculateBorderTimings,
  getCurrentHours,
  getCurrentMinutes,
  getDayIndex,
  INTERVAL_DURATION_MINS,
  NUM_INTERVALS_PER_HOUR,
  SCHOOLDAYS,
} from 'utils/timify';
import elements from 'views/elements';
import withTimer, { TimerData } from 'views/hocs/withTimer';

import { TimePeriod } from 'types/venues';
import styles from './Timetable.scss';
import TimetableTimings from './TimetableTimings';
import TimetableDay from './TimetableDay';

type Props = TimerData & {
  lessons: TimetableArrangement;
  // These should be non-optional, but because HOCs currently strip defaultProps
  // for the sake of our sanity we type these as optional to reduce errors at call sites
  isVerticalOrientation?: boolean;
  isScrolledHorizontally?: boolean;
  showTitle?: boolean;
  onModifyCell?: OnModifyCell;
  highlightPeriod?: TimePeriod;
};

type State = {
  hoverLesson: HoverLesson | null;
};

const nullCurrentTimeIndicatorStyle: React.CSSProperties = {
  opacity: 0,
};

const EMPTY_ROW_LESSONS = [[]];

class Timetable extends React.PureComponent<Props, State> {
  static defaultProps = {
    isVerticalOrientation: false,
    isScrolledHorizontally: false,
    showTitle: false,
    onModifyCell: noop,
  };

  override state = {
    hoverLesson: null,
  };

  onCellHover = (hoverLesson: HoverLesson | null) => {
    this.setState({ hoverLesson });
  };

  addCustomLesson = (
    current: TimetableArrangement,
    customLesson: [day: string, lesson: Omit<ModifiableLesson, 'day'>][],
  ) => {
    let result = { ...current };
    customLesson.forEach(([day, lesson]) => {
      result = {
        ...result,
        [day]: [
          (result[day] || [[]])[0].concat([{ ...lesson, day }]),
          ...(result[day] || []).slice(1),
        ],
      };
    });
    return result;
  };

  override render() {
    const { highlightPeriod } = this.props;

    const tmpLessons: TimetableArrangement = this.addCustomLesson(this.props.lessons, [
      [
        'Monday',
        {
          classNo: 'Unofficial IG',
          startTime: '1700',
          endTime: '1900',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          venue: 'Yale Field',
          lessonType: '',
          moduleCode: 'Frisbee',
          title: '',
          colorIndex: -1,
        },
      ],
      [
        'Wednesday',
        {
          classNo: 'IG',
          startTime: '2200',
          endTime: '2359',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          venue: 'MPSH',
          lessonType: '',
          moduleCode: 'Frisbee',
          title: '',
          colorIndex: -1,
        },
      ],
      [
        'Tuesday',
        {
          classNo: 'Meeting',
          startTime: '2030',
          endTime: '2200',
          weeks: [2, 4, 6, 8, 10, 12],
          venue: 'SR',
          lessonType: '',
          moduleCode: 'CSC Pubs',
          title: '',
          colorIndex: -1,
        },
      ],
      [
        'Wednesday',
        {
          classNo: 'Meeting',
          startTime: '1900',
          endTime: '2100',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          venue: 'COM',
          lessonType: '',
          moduleCode: 'Greyhats',
          title: '',
          colorIndex: -1,
        },
      ],
      [
        'Thursday',
        {
          classNo: '02',
          startTime: '1000',
          endTime: '1100',
          weeks: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          venue: 'COM1-0113',
          lessonType: 'Tutorial',
          moduleCode: 'CS2100 TA',
          title: '',
          colorIndex: 6,
        },
      ],
      [
        'Thursday',
        {
          classNo: '03',
          startTime: '1100',
          endTime: '1200',
          weeks: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          venue: 'COM1-0113',
          lessonType: 'Tutorial',
          moduleCode: 'CS2100 TA',
          title: '',
          colorIndex: 6,
        },
      ],
      [
        'Thursday',
        {
          classNo: 'Meeting',
          startTime: '2200',
          endTime: '2359',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          venue: 'L8 Lounge',
          lessonType: '',
          moduleCode: 'DFC',
          title: '',
          colorIndex: -1,
        },
      ],
      [
        'Wednesday',
        {
          classNo: 'Office Hours',
          startTime: '1400',
          endTime: '1600',
          weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          venue: 'COM',
          lessonType: '',
          moduleCode: 'NUSMods',
          title: '',
          colorIndex: -1,
        },
      ],
    ]);

    const schoolDays = SCHOOLDAYS.filter((day) => day !== 'Saturday' || tmpLessons.Saturday);

    const lessons = flattenDeep<ColoredLesson>(values(tmpLessons));
    const { startingIndex, endingIndex } = calculateBorderTimings(lessons, highlightPeriod);
    const currentDayIndex = getDayIndex(); // Monday = 0, Friday = 4

    // Calculate the margin offset for the CurrentTimeIndicator
    const columns = endingIndex - startingIndex;
    const currentHours = getCurrentHours();
    const currentMinutes = getCurrentMinutes();
    const hoursMarginOffset =
      ((currentHours * NUM_INTERVALS_PER_HOUR - startingIndex) / columns) * 100;
    const minutesMarginOffset = (currentMinutes / INTERVAL_DURATION_MINS / columns) * 100;
    const currentTimeIndicatorVisible =
      currentHours * NUM_INTERVALS_PER_HOUR >= startingIndex &&
      currentHours * NUM_INTERVALS_PER_HOUR < endingIndex;
    const dirStyle = this.props.isVerticalOrientation ? 'top' : 'marginLeft';
    const currentTimeIndicatorStyle: React.CSSProperties = {
      [dirStyle]: `${hoursMarginOffset + minutesMarginOffset}%`,
    };

    return (
      <div>
        <div className={classnames(styles.container, elements.timetable)}>
          <TimetableTimings startingIndex={startingIndex} endingIndex={endingIndex} />
          <ol className={styles.days}>
            {schoolDays.map((day, index) => (
              <TimetableDay
                key={day}
                day={day}
                startingIndex={startingIndex}
                endingIndex={endingIndex}
                onModifyCell={this.props.onModifyCell}
                hoverLesson={this.state.hoverLesson}
                onCellHover={this.onCellHover}
                verticalMode={this.props.isVerticalOrientation || false}
                showTitle={this.props.showTitle || false}
                isScrolledHorizontally={this.props.isScrolledHorizontally || false}
                dayLessonRows={tmpLessons[day] || EMPTY_ROW_LESSONS}
                isCurrentDay={index === currentDayIndex}
                currentTimeIndicatorStyle={
                  index === currentDayIndex && currentTimeIndicatorVisible
                    ? currentTimeIndicatorStyle
                    : nullCurrentTimeIndicatorStyle
                }
                highlightPeriod={
                  highlightPeriod && index === highlightPeriod.day ? highlightPeriod : undefined
                }
              />
            ))}
          </ol>
        </div>
      </div>
    );
  }
}

export default withTimer(Timetable);
