import React, { Component } from 'react';

class PickTracker extends Component {
    /* Component used to keep a list of the numbers used and
     * numbers available for picks on the selected week. Rendered
     * on the right side of the page.
     */
    renderTracker() {
      const { games, numsUsed } = this.props;
      var htmlEle = [];

      for (var i = 0; i < Object.keys(games).length; i++) {
        // Uses a for loop which loops from 0 to Max Games - 1
        // If the number is in numsUsed state of the Picks page
        // cross it out with a red line (textDecoration: 'line-through')
        if (numsUsed.includes(i+1))
          htmlEle.push(<div style={{color: 'red', textDecoration:'line-through'}} key={i}>
                         <div style={{color:'black'}}>
                           {i+1}
                         </div>
                       </div>);
        else {
          htmlEle.push(<div key={i}>
                        {i+1}
                      </div>);
        }
      }

      return (<div style={styles.sideTracker}>
                <div style={styles.trackerCounter}>
                  {htmlEle}
                </div>
              </div>);
    }

    render() {
      return(
        <div style={styles.stickyStyle}>{this.renderTracker()}</div>
      )
    }
}

const styles = {
  stickyStyle: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100%',
    zIndex: 100000,
    width: '40px',
    backgroundColor: '#C0C0C0'
  },
  sideTracker: {
    display:'table',
    textAlign: 'center',
    height:'85%',
    width: '100%'
  },
  trackerCounter: {
    display: 'table-cell',
    verticalAlign:'middle',
    textAlign: 'center',
    fontSize: '30px',
  }
}

export default PickTracker;
