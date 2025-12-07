import { useState, useEffect } from "react"
import {
  getFacultyClasses,
  getClassAssignments,
  getFacultyStudents,
} from "@/services/facultyService"
import { FacultyClass, Student, ClassAssignmentStatus } from "@/types/faculty-types"

export function useFacultyClasses() {
  const [classes, setClasses] = useState<FacultyClass[]>([])
  const [selectedClass, setSelectedClass] = useState<FacultyClass | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<ClassAssignmentStatus[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all classes on mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const data = await getFacultyClasses()
        setClasses(data)
      } catch (err) {
        console.error("Error loading classes:", err)
        setError("Failed to load classes. Please try again.")
      } finally {
        setIsLoadingClasses(false)
      }
    }

    fetchClasses()
  }, [])

  // Load class details (students and assignments)
  const loadClassDetails = async (classData: FacultyClass) => {
    setSelectedClass(classData)
    setError(null)

    try {
      setIsLoadingAssignments(true)
      setIsLoadingStudents(true)

      // Fetch assignments
      const assignmentsData = await getClassAssignments(classData.id)
      setAssignments(assignmentsData)

      // Fetch all students in the class
      const allStudentsData: Student[] = await getFacultyStudents(classData.id)

      // Enhance students with their assignment data
      const studentsWithAssignments = allStudentsData.map((student) => {
        const studentAssignments = assignmentsData
          .filter((a) => a.studentId === student.id)
          .map((a) => ({
            caseId: a.caseId,
            title: a.caseTitle,
          }))

        return {
          ...student,
          caseAssignments: studentAssignments,
        }
      })

      setStudents(studentsWithAssignments)
    } catch (error: unknown) {
      console.error("Error fetching class data:", error)
      if (error instanceof Error) {
        setError(`Failed to load class data: ${error.message}`)
      } else {
        setError("Failed to load class data. Please try again.")
      }
    } finally {
      setIsLoadingAssignments(false)
      setIsLoadingStudents(false)
    }
  }

  const refreshAssignments = async () => {
    if (!selectedClass) return

    try {
      setIsLoadingAssignments(true)
      const assignmentsData = await getClassAssignments(selectedClass.id)
      setAssignments(assignmentsData)
    } catch (error) {
      console.error("Error refreshing assignments:", error)
      setError("Failed to refresh assignments.")
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const clearSelectedClass = () => {
    setSelectedClass(null)
    setStudents([])
    setAssignments([])
  }

  return {
    classes,
    selectedClass,
    students,
    assignments,
    isLoadingClasses,
    isLoadingStudents,
    isLoadingAssignments,
    error,
    loadClassDetails,
    setAssignments,
    refreshAssignments,
    clearSelectedClass,
  }
}
