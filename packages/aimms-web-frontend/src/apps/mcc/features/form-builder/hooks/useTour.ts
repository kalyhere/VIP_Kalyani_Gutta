import { useState, useEffect, useRef } from "react"
import { CallBackProps, STATUS, EVENTS, ACTIONS } from "react-joyride"
import { Theme } from "@mui/material"

export const useTour = (cases: any[], theme: Theme) => {
  const [runTour, setRunTour] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isTableJustCreated, setIsTableJustCreated] = useState(false)
  const createButtonRef = useRef<HTMLButtonElement>(null)

  const startTour = () => {
    setStepIndex(0)
    setIsTableJustCreated(false)
    setRunTour(true)
  }

  // Effect to handle tour advancement after table creation
  useEffect(() => {
    if (runTour && isTableJustCreated && cases.length > 0) {
      const currentCase = cases[cases.length - 1]
      const lastSection = currentCase.sections[currentCase.sections.length - 1]
      if (lastSection && lastSection.tables.length > 0) {
        setStepIndex(18)
        setIsTableJustCreated(false)
      }
    }
  }, [isTableJustCreated, cases, runTour])

  const dashboardSteps = [
    {
      // step 0
      target: ".mcc-header",
      content:
        "Welcome to the Medical Case Creator! This tool helps you create and manage structured medical cases.",
      placement: "center" as const,
      disableBeacon: true,
    },
    {
      // step 1
      target: ".help-button",
      content: "You can restart this tour anytime by clicking this button.",
      placement: "bottom" as const,
    },
    {
      // step 2
      target: ".download-cases-button",
      content: "Download your cases as a JSON file to save them or share with others.",
      placement: "bottom" as const,
    },
    {
      // step 3
      target: ".upload-cases-button",
      content: "Upload previously saved cases or import cases from others.",
      placement: "bottom" as const,
    },
    {
      // step 4
      target: createButtonRef.current!,
      content: "You can create a new medical case by clicking this button.\n\nGo ahead, click it!",
      placement: "bottom" as const,
      disableOverlayClose: true,
      hideCloseButton: true,
      hideFooter: true,
      spotlightClicks: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 5
      target: ".case-name-input",
      content: "Give your case a descriptive name.",
      placement: "bottom" as const,
      spotlightClicks: true,
      hideBackButton: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 6
      target: ".create-case-submit",
      content: "Click Create to create your new case and start building it.",
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      hideFooter: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 7
      target: ".case-title",
      content:
        "For purposes of this tour, we have loaded in a default medical simulation case format to help you understand the structure.",
      placement: "bottom" as const,
      hideBackButton: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 8
      target: ".section-1-case-summary-section",
      content:
        "A section helps organize your content. Each section can contain multiple tables to structure your information logically.",
      placement: "bottom" as const,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 9
      target: ".case-title-table",
      content:
        "Tables help structure your data. Each table can have multiple rows and columns. Notice the variables in curly braces like {scenario_title} - these will be filled with AI-generated content.",
      placement: "bottom" as const,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 10
      target: ".add-section-button",
      content:
        'Now that you\'ve seen the example template, let\'s create your own section. Click "Add Section" to begin. In the dialog that appears, enter a name for your section (e.g., "Patient Information" or "Medical History") and press "Add".',
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      hideFooter: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 11
      target: ".section-add-button",
      content: "",
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      hideFooter: true,
      disableOverlay: true,
      styles: {
        options: {
          zIndex: 1,
        },
        tooltip: {
          display: "none",
        },
      },
    },
    {
      // step 12
      target: ".case-section:last-child .add-table-button",
      content:
        'Now add a table to your section by clicking "Add Table". In the dialog that appears, enter a descriptive title for your table.',
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      hideFooter: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 13
      target: ".table-insert-button",
      content: "",
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      hideFooter: true,
      disableOverlay: true,
      styles: {
        options: {
          zIndex: 1,
        },
        tooltip: {
          display: "none",
        },
      },
    },
    {
      // step 14
      target: ".case-section:last-child .case-table tr:first-child td:first-child",
      content:
        "Click the highlighted cell and try typing a prompt in curly braces, like {patient name} or {patient's favorite food} - basically anything you'd like AI to generate! After you've entered your variable, click Next.",
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      hideFooter: false,
      disableOverlay: false,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 15
      target:
        ".case-section:last-child .case-table tbody tr:first-child td:first-child .ai-generate-button",
      content: "Click this green AI button to generate content for your variable.",
      placement: "right" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      hideFooter: true,
      disableOverlay: false,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 16
      target: ".case-section:last-child .case-table tbody tr:first-child .table-cell",
      content:
        "The AI has replaced your variable with generated content! You can regenerate or clear the content using the buttons that appear on hover.",
      placement: "bottom" as const,
      disableOverlayClose: true,
      hideBackButton: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 17
      target: ".case-section:last-child .table-ai-actions",
      content:
        "You can also perform AI actions on the entire table. Click here to fill all variables, regenerate all content, or reset the table.",
      placement: "bottom" as const,
      disableOverlayClose: true,
      hideBackButton: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 18
      target: ".form-ai-actions",
      content:
        "Or perform AI actions on the entire form at once! This will affect all tables in your case.",
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 19
      target: ".creativity-slider",
      content:
        "Adjust the creativity level to control how varied the AI-generated content will be. Higher values mean more creative but potentially less consistent responses.",
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 20
      target: ".print-icon-button",
      content: "Click here to print your case or save it as a PDF.",
      placement: "bottom" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
    {
      // step 21
      target: ".form-actions",
      content:
        "Access more actions here like downloading/uploading formats or clearing all content.",
      placement: "left" as const,
      disableOverlayClose: true,
      spotlightClicks: true,
      styles: {
        options: {
          zIndex: 10000,
        },
      },
    },
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data

    // Only process events if tour is running
    if (!runTour) return

    // Reset tour when finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false)
      setStepIndex(0)
      return
    }

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1)

      // Define interactive steps first
      const interactiveSteps = [
        4, // Create new case button
        5, // Case name input
        6, // Create case submit button
        10, // Add Section button in empty case
        11, // Hidden section-add-button in dialog
        12, // Add Table button in new section
        13, // Hidden table-insert-button in dialog
        14, // Cell input for variable
        15, // AI generate button in cell
        16, // View generated content in cell
        17, // Table AI actions button
      ]

      // For TARGET_NOT_FOUND, don't advance if it's an interactive step
      if (type === EVENTS.TARGET_NOT_FOUND && interactiveSteps.includes(index)) {
        // Special handling for table insert step
        if (index === 13) {
          const checkForTableCell = () => {
            const target = document.querySelector(
              ".MuiTableCell-root.MuiTableCell-body.MuiTableCell-sizeMedium"
            )
            if (target) {
              setStepIndex(14)
            } else {
              setTimeout(checkForTableCell, 100)
            }
          }
          setTimeout(checkForTableCell, 100)
        }
        return
      }

      // Handle steps with timeouts
      if (index === 15 && action !== ACTIONS.PREV) {
        setTimeout(() => setStepIndex(index + 1), 2000)
        return
      }

      // Handle interactive steps
      if (interactiveSteps.includes(index)) {
        if (action === ACTIONS.NEXT) {
          setStepIndex(index + 1)
        }
        return
      }

      // Handle regular steps
      if (type === EVENTS.STEP_AFTER) {
        setStepIndex(nextStepIndex)
      }
    }
  }

  const tourConfig = {
    steps: dashboardSteps,
    run: runTour,
    stepIndex,
    continuous: true,
    showSkipButton: true,
    hideCloseButton: true,
    disableCloseOnEsc: true,
    disableOverlayClose: true,
    spotlightPadding: 5,
    scrollOffset: 500,
    styles: {
      options: {
        primaryColor: theme.palette.primary.main,
        overlayColor: "rgba(0, 0, 0, 0.5)",
        backgroundColor: theme.palette.background.paper,
        textColor: theme.palette.text.primary,
        top: "200px",
      },
    },
    callback: handleJoyrideCallback,
    locale: {
      last: "Got it!",
      skip: "Skip",
      next: "Next",
      back: "Back",
    },
  }

  return {
    runTour,
    setRunTour,
    tourConfig,
    setStepIndex,
    isTableJustCreated,
    setIsTableJustCreated,
    startTour,
    createButtonRef,
  }
}
