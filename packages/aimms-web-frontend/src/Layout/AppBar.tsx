import { AppBar } from "react-admin"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import FeedbackIcon from "@mui/icons-material/Feedback"

import Logo from "./Logo"

export default function MyAppBar() {
  return (
    <AppBar color="primary" sx={{ backgroundColor: "#ab0520" }}>
      <Logo sx={{ maxWidth: "250px" }} />
      <Box flex="1" />
      {/* <Button
        color="inherit"
        startIcon={<FeedbackIcon />}
        href="https://docs.google.com/forms/d/e/1FAIpQLScp1PydgG9HbmWmkEATz2yjVDjY6F2JQbGVoeFWjF99SJQ-bA/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        sx={{ mr: 2 }}>
        Provide Feedback
      </Button> */}
    </AppBar>
  )
}
