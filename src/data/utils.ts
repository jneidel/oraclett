export function findInstancesOfProjectInData( projectKey: string, data: any ): Array<{
  year: string;
  week: string;
}> {
  return Object.keys( data ).reduce( ( acc: any[], year ) => {
    const dataForYear = data[year];

    const result = Object.keys( dataForYear ).reduce( ( acc: any[], week ) => {
      const dataForWeek = dataForYear[week];

      if ( dataForWeek[projectKey] )
        acc.push( { year, week } );

      return acc;
    }, [] );

    return [ ...acc, ...result ];
  }, [] );
}
export function findInstancesOfTaskDetailInData( projectKey: string, taskDetailKey: string, data: any ): Array<{
  year: string;
  week: string;
}> {
  return findInstancesOfProjectInData( projectKey, data )
    .filter( instance => !!data[instance.year][instance.week][projectKey][taskDetailKey] );
}
