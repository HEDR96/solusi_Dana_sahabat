package com.solusidana.sahabat.ui.applications

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.solusidana.sahabat.data.Application
import com.solusidana.sahabat.data.formatRupiah
import com.solusidana.sahabat.data.statusColor
import com.solusidana.sahabat.data.statusLabel
import com.solusidana.sahabat.databinding.ItemApplicationBinding

class ApplicationAdapter(
    private val onClick: (Application) -> Unit
) : ListAdapter<Application, ApplicationAdapter.VH>(DIFF) {

    inner class VH(private val b: ItemApplicationBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(app: Application) {
            b.tvCustomer.text = app.customerName
            b.tvAgent.text    = "Agen: ${app.agentName ?: "-"}"
            b.tvDate.text     = app.inputDate ?: ""
            b.tvStatus.text   = statusLabel(app.status)
            b.tvStatus.setTextColor(statusColor(app.status))
            b.tvAmount.text   = formatRupiah(app.pinjaman)
            b.tvAppId.text    = app.id
            b.root.setOnClickListener { onClick(app) }
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, t: Int) = VH(
        ItemApplicationBinding.inflate(LayoutInflater.from(p.context), p, false)
    )

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    companion object {
        val DIFF = object : DiffUtil.ItemCallback<Application>() {
            override fun areItemsTheSame(o: Application, n: Application) = o.id == n.id
            override fun areContentsTheSame(o: Application, n: Application) = o == n
        }
    }
}
