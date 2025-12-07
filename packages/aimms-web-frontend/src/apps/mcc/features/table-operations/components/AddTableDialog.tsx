import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  IconButton,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"

interface TableDialogData {
  title: string
  rows: number
  columns: number
  hasHeader: boolean
}

interface AddTableDialogProps {
  open: boolean
  onClose: () => void
  data: TableDialogData
  onDataChange: (data: TableDialogData) => void
  onAdd: () => void
  isValid: boolean
}

const AddTableDialog = ({
  open,
  onClose,
  data,
  onDataChange,
  onAdd,
  isValid,
}: AddTableDialogProps) => {
  const handleRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? 1 : parseInt(e.target.value)
    onDataChange({
      ...data,
      rows: Math.min(Math.max(1, value), 10),
    })
  }

  const handleColumnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? 1 : parseInt(e.target.value)
    onDataChange({
      ...data,
      columns: Math.min(Math.max(1, value), 10),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" keepMounted>
      <DialogTitle>Insert Table</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              label="Table Title"
              name="new-table-title"
              fullWidth
              value={data.title}
              onChange={(e) => onDataChange({ ...data, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Number of Rows"
              type="number"
              name="new-table-rows"
              fullWidth
              value={data.rows}
              onChange={handleRowsChange}
              error={typeof data.rows === "number" && (data.rows < 1 || data.rows > 10)}
              helperText={
                typeof data.rows === "number" && (data.rows < 1 || data.rows > 10)
                  ? "Enter a number between 1-10"
                  : ""
              }
              inputProps={{ min: 1, max: 10 }}
              sx={{
                "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
                "& input[type=number]": {
                  MozAppearance: "textfield",
                },
              }}
              InputProps={{
                endAdornment: (
                  <Box sx={{ display: "flex", flexDirection: "column", ml: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleRowsChange({
                        target: {
                          value: String(
                            Math.min((typeof data.rows === "number" ? data.rows : 1) + 1, 10)
                            ),
                        },
                      } as any)
                      }
                      sx={{
                        p: 0,
                        minWidth: "20px",
                        minHeight: "12px",
                        borderRadius: 0,
                        "&:hover": { bgcolor: "transparent", color: "primary.main" },
                      }}>
                      <AddIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleRowsChange({
                        target: {
                          value: String(
                            Math.max((typeof data.rows === "number" ? data.rows : 2) - 1, 1)
                            ),
                        },
                      } as any)
                      }
                      sx={{
                        p: 0,
                        minWidth: "20px",
                        minHeight: "12px",
                        borderRadius: 0,
                        "&:hover": { bgcolor: "transparent", color: "primary.main" },
                      }}>
                      <RemoveIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                  </Box>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Number of Columns"
              type="number"
              name="new-table-columns"
              fullWidth
              value={data.columns}
              onChange={handleColumnsChange}
              error={typeof data.columns === "number" && (data.columns < 1 || data.columns > 10)}
              helperText={
                typeof data.columns === "number" && (data.columns < 1 || data.columns > 10)
                  ? "Enter a number between 1-10"
                  : ""
              }
              inputProps={{ min: 1, max: 10 }}
              sx={{
                "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
                "& input[type=number]": {
                  MozAppearance: "textfield",
                },
              }}
              InputProps={{
                endAdornment: (
                  <Box sx={{ display: "flex", flexDirection: "column", ml: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleColumnsChange({
                        target: {
                          value: String(
                            Math.min(
                              (typeof data.columns === "number" ? data.columns : 1) + 1,
                              10
                            )
                          ),
                        },
                      } as any)
                      }
                      sx={{
                        p: 0,
                        minWidth: "20px",
                        minHeight: "12px",
                        borderRadius: 0,
                        "&:hover": { bgcolor: "transparent", color: "primary.main" },
                      }}>
                      <AddIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleColumnsChange({
                        target: {
                          value: String(
                            Math.max((typeof data.columns === "number" ? data.columns : 2) - 1, 1)
                            ),
                        },
                      } as any)
                      }
                      sx={{
                        p: 0,
                        minWidth: "20px",
                        minHeight: "12px",
                        borderRadius: 0,
                        "&:hover": { bgcolor: "transparent", color: "primary.main" },
                      }}>
                      <RemoveIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                  </Box>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={data.hasHeader}
                  onChange={(e) => onDataChange({ ...data, hasHeader: e.target.checked })}
                />
              }
              label="Include header row"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ m: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onAdd}
          variant="contained"
          disabled={!isValid}
          className="table-insert-button">
          Insert
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTableDialog
