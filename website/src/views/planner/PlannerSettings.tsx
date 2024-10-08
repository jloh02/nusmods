import * as React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';

import config from 'config';
import { getYearsBetween, offsetAcadYear } from 'utils/modules';
import { acadYearLabel } from 'utils/planner';
import {
  setPlannerIBLOCs,
  setPlannerMaxYear,
  setPlannerMinYear,
  setIgnorePrerequisitesCheck,
} from 'actions/planner';
import ExternalLink from 'views/components/ExternalLink';
import Toggle from 'views/components/Toggle';
import CloseButton from 'views/components/CloseButton';
import { State } from 'types/state';
import styles from './PlannerSettings.scss';

type Props = {
  readonly minYear: string;
  readonly maxYear: string;
  readonly iblocs: boolean;
  readonly ignorePrereqCheck?: boolean;

  // Actions
  readonly onCloseButtonClicked: () => void;
  readonly setMinYear: (str: string) => void;
  readonly setMaxYear: (str: string) => void;
  readonly setIBLOCs: (boolean: boolean) => void;
  readonly setPrereqsCheck: (boolean: boolean) => void;
};

const MIN_YEARS = -5; // Studying year 6
const MAX_YEARS = 1; // One year before matriculation
const GRADUATE_IN = 6; // Graduating a max of 6 years from now

// Extracted to a constant to reduce re-renders
const TOGGLE_LABELS: [string, string] = ['Yes', 'No'];

export function getYearLabels(minOffset: number, maxOffset: number) {
  return getYearsBetween(
    offsetAcadYear(config.academicYear, minOffset),
    offsetAcadYear(config.academicYear, maxOffset),
  );
}

function graduationLabel(offset: number) {
  if (offset === 0) return 'This year';
  if (offset === 1) return 'Next year';
  return `In ${offset} years`;
}

function buttonProps(selected: boolean, disabled: boolean) {
  return {
    disabled,
    className: classnames('btn btn-block', {
      'btn-outline-secondary': disabled,
      'btn-outline-primary': !selected && !disabled,
      'btn-primary': selected,
    }),
  };
}

export const PlannerSettingsComponent: React.FC<Props> = (props) => {
  const matriculationLabels = getYearLabels(MIN_YEARS, MAX_YEARS).reverse();
  const graduationLabels = getYearLabels(0, GRADUATE_IN);

  return (
    <div className={styles.settings}>
      <CloseButton className={styles.closeButton} onClick={props.onCloseButtonClicked} />
      <section>
        <h2 className={styles.label}>Matriculated in</h2>
        <ul className={styles.years}>
          {matriculationLabels.map((year, i) => {
            const offset = i - MAX_YEARS;

            return (
              <li key={year}>
                <button
                  type="button"
                  onClick={() => props.setMinYear(year)}
                  {...buttonProps(props.minYear === year, year > props.maxYear)}
                >
                  AY{acadYearLabel(year)}
                  <span className={styles.subtitle}>
                    (
                    {offset >= 0
                      ? `currently year ${offset + 1}`
                      : graduationLabel(-offset).toLowerCase()}
                    )
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className={styles.label}>Graduating</h2>
        <ul className={styles.years}>
          {graduationLabels.map((year, offset) => (
            <li key={year}>
              <button
                type="button"
                onClick={() => props.setMaxYear(year)}
                {...buttonProps(props.maxYear === year, year < props.minYear)}
              >
                {graduationLabel(offset)}
                <span className={styles.subtitle}>(AY{acadYearLabel(year)})</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.toggleSection}>
        <div>
          <h2 className={styles.label}>Taking iBLOCs</h2>

          <p>
            <ExternalLink href="http://www.nus.edu.sg/ibloc/iBLOC.html">iBLOCs</ExternalLink> is a
            program that allows full-time NSmen to read some courses before matriculating.
          </p>
        </div>

        <Toggle
          labels={TOGGLE_LABELS}
          isOn={props.iblocs}
          onChange={(checked) => props.setIBLOCs(checked)}
        />
      </section>

      <section className={styles.toggleSection}>
        <div>
          <h2 className={styles.label}>Ignore Prerequisite Checking</h2>

          <p>
            Prerequisite checking for some courses might be inaccurate, giving planner warnings.
            Turning this on removes these checks entirely.
          </p>
          <p>
            Please ensure that you manually check that the prerequisites for the courses you would
            like to take are sufficiently met.
          </p>
        </div>

        <Toggle
          isOn={props.ignorePrereqCheck}
          onChange={(checked) => props.setPrereqsCheck(checked)}
        />
      </section>
    </div>
  );
};

const PlannerSettings = connect(
  (state: State) => ({
    minYear: state.planner.minYear,
    maxYear: state.planner.maxYear,
    iblocs: state.planner.iblocs,
    ignorePrereqCheck: state.planner.ignorePrereqCheck,
  }),
  {
    setMaxYear: setPlannerMaxYear,
    setMinYear: setPlannerMinYear,
    setIBLOCs: setPlannerIBLOCs,
    setPrereqsCheck: setIgnorePrerequisitesCheck,
  },
)(PlannerSettingsComponent);

export default PlannerSettings;
