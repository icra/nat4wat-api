attach(input[[1]])

needs("broom")

l_in <- df$bod_in * df$inflow
l_out <- df$bod_out * df$inflow
df$l_removal <- l_in - l_out

lm(surface ~ l_removal + 0, df) |> broom::tidy()
