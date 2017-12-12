import React, { Component } from 'react';
import Dropdown from 'react-dropdown';

const weeks = ['1', '2', '3', '4',
               '5', '6', '7', '8',
               '9', '10', '11', '12',
               '13', '14', '15', '16', '17']

class WeeksDropDown extends Component {
  state = {
    selected: weeks[0]
  }

  _onSelect (week) {
    console.log('You  selected ', week.label);
    this.setState({selected: week});
  }

  render () {
    const defaultOption = this.props.selectedWeek;

    return (
      <div>
      Select a Week:
        <div style={styles.dropdownStyle}>
          <Dropdown options={weeks} onChange={(week) => this.props.onWeekSelect(week)} value={defaultOption} placeholder="Select a week" />
        </div>
      </div>
    )
  }
}

const styles = {
  dropdownStyle: {
    width: '75px',
    margin: '10px auto',
    justifyContent: 'center'
  }
}

export default WeeksDropDown;
