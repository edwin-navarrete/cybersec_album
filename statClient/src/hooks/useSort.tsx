import React, { useState, useEffect }from 'react';
import { getEffectiveTypeParameterDeclarations } from 'typescript';
// Hook to sort the array by status, less response time and less getEffectiveTypeParameterDeclarations. 

const useSort = (dataToSort: any) => {
    // const [dataSorted, setDataSorted] = useState([])

    if (dataToSort.length > 0) {
        // setDataSorted(dataToSort);
       
       dataToSort.sort(function(a: any,b:any) {
            //Sort by status of album (enden or not)
            if (a.ended_album > b.ended_album) {
                return -1;
            }
        
            if (a.ended_album < b.ended_album) {
                return 1;
            }
            //Sort by less response_time
            return a.total_response_time - b.total_response_time;
            //Sort by less error number
            return a.error_number - b.error_number
        })
    }
    ;
    // const [dataSorted, setDataSorted] = useState([])
    // if (dataToSort.length > 0) {
    //     setDataSorted(dataToSort);
       
    //    dataSorted.sort(function(a: any,b:any) {
    //         //Sort by status of album (enden or not)
    //         if (a.ended_album > b.ended_album) {
    //             return -1;
    //         }
        
    //         if (a.ended_album < b.ended_album) {
    //             return 1;
    //         }
    //         //Sort by minor response_time
    //         return a.total_response_time - b.total_response_time;
    //         //Sort by minor error number
    //         // return a.error_number - b.error_number
    //     })
    // }
    // ;

    // 
   
    
    //Less time
    // .sort(function endedAlbum(a: { total_response_time: number; }, b: { total_response_time: number; }) {
    //     if (a.total_response_time < b.total_response_time){
    //         return 1;
    //     }
    //     if (a.total_response_time > b.total_response_time){
    //         return -1;
    //     }
    //     return 0;
    // })
    // setDataSorted()
  return (
    // dataSorted
    dataToSort
  )
}

export default useSort
