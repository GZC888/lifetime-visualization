import {useCallback, useEffect, useState} from "react";
import {Milestone} from "@/components/CustomMilestoneDialog";
import {endOfMonth, endOfWeek, parseISO, startOfWeek} from "date-fns";
import useStorage from "@/hooks/useStorage";
import {sortMilestones} from "@/utils/milestoneUtil";
import milestone from "@/components/Milestone";

const defaultMilestoneDurationYears = [3, 3, 6, 3, 3, 4]
export default function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      label: '童年',
      color: '#26AD5F',
      images: [],
      default: true
    },
    {
      label: '幼儿园',
      color: '#5476AA',
      images: [],
      default: true
    },
    {
      label: '小学',
      color: '#EB5757',
      images: [],
      default: true
    },
    {
      label: '初中',
      color: '#8079B6',
      images: [],
      default: true
    },
    {
      label: '高中',
      color: '#C77BAA',
      images: [],
      default: true
    },
    {
      label: '大学本科',
      color: '#EFCB6C',
      images: [],
      default: true
    },
    {
      label: '日常',
      color: '#FF38CD4C',
      images: [],
      default: true
    }
  ])

  const {save, load} = useStorage()

  const addMilestone = useCallback((milestone: Milestone) => {
    milestones.splice(milestones.length - 1, 0, milestone)
    const normalMilestoneIndex = milestones.findIndex(it => it.label === '日常')
    const normalMilestone = milestones[normalMilestoneIndex]
    milestones.splice(normalMilestoneIndex, 1)
    milestones.push({
      ...normalMilestone,
      startDate: undefined,
      endDate: undefined
    })

    setMilestones([...sortMilestones(milestones)])
    save({
      milestones
    })
  }, [milestones])

  const updateMilestone = (oldLabel: string, milestone: Milestone) => {
    const index = milestones.findIndex(it => it.label === oldLabel)
    milestones[index] = milestone
    setMilestones([...sortMilestones(milestones)])
    save({
      milestones
    })
  }

  const removeMilestone = (index: number) => {
    setMilestones((prevState) => {
      const newMilestones = [...prevState];
      newMilestones.splice(index, 1);
      save({
        milestones: newMilestones
      })
      return newMilestones;
    })
  }

  /*
  * when change birthday, calculate milestone's start/end date
  * */
  const confirmMilestoneDate = (birthday: Date) => {
    const data = load()
    let pastYears = 0
    const month = birthday.getMonth()
    const extraSchoolGapYear = month < 8 ? 0 : 1 // 9.1 is school's enter date, if born after this date, need enter school next year
    const newMilestones: Milestone[] = (data?.milestones || milestones)
      .filter(it => it.default)
      .map(((it, index) => {
        let startDate
        if (index === 0) {
          startDate = birthday
        } else {
          startDate = index < defaultMilestoneDurationYears.length ?
            new Date(birthday.getFullYear() + pastYears + extraSchoolGapYear, 8, 1) :
            new Date(birthday.getFullYear() + defaultMilestoneDurationYears.reduce((previousValue, currentValue) => previousValue + currentValue, 0), 6, 1)
        }
        const object = {
          ...it,
          startDate,
          endDate: index < defaultMilestoneDurationYears.length ?
            new Date(birthday.getFullYear() + defaultMilestoneDurationYears[index] + pastYears + extraSchoolGapYear, 5, 1) :
            new Date()
        }
        pastYears += defaultMilestoneDurationYears[index]
        return object
      }))
    setMilestones([...sortMilestones(newMilestones)])
    save({
      milestones: newMilestones
    })
  }

  const isMilestoneExist = (label: string) => {
    return milestones.find(it => it.label === label) !== undefined
  }

  useEffect(() => {
    const data = load()
    if (data?.milestones) {
      const newMilestones = data.milestones
        .map((it: Milestone) => {
          return {
            ...it,
            startDate: it.startDate ? parseISO(it.startDate + '') : undefined,
            endDate: it.endDate ? parseISO(it.endDate + '') : undefined
          }
        })
      setMilestones(sortMilestones(newMilestones))
    }
  }, []);

  const getCoveredMilestone = (date: Date, unit: number) => {
    return milestones
      .filter(it => it.startDate !== undefined && it.endDate !== undefined)
      .filter(it => {
        switch (unit) {
          case 1: {
            const startYear = it.startDate!.getFullYear()
            const endYear = it.endDate!.getFullYear()
            return date.getFullYear() >= startYear && date.getFullYear() <= endYear
          }
          case 12: {
            const startDate = new Date(it.startDate!.getFullYear(), it.startDate!.getMonth())
            const endDate = endOfMonth(it.endDate!)
            return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime()
          }
          case 52: {
            const startDate = startOfWeek(it.startDate!)
            const endDate = endOfWeek(it.endDate!)
            return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime()
          }
          case 365: {
            return date.getTime() >= it.startDate!.getTime() && date.getTime() <= it.endDate!.getTime()
          }
        }
      })
  }

  return {
    milestones,
    addMilestone,
    updateMilestone,
    removeMilestone,
    confirmMilestoneDate,
    isMilestoneExist,
    getCoveredMilestone
  }
}