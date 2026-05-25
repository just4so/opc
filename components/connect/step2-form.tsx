'use client'

import { useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Upload, Loader2 } from 'lucide-react'
import { Step2Data } from './connect-form'

interface Step2FormProps {
  form: UseFormReturn<Step2Data>
  submitting: boolean
  bpFile: { url: string; filename: string } | null
  setBpFile: (val: { url: string; filename: string } | null) => void
  bpUploading: boolean
  bpError: string
  onBpUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
  onSubmit: (data: Step2Data) => void
}

export function Step2Form({
  form,
  submitting,
  bpFile,
  setBpFile,
  bpUploading,
  bpError,
  onBpUpload,
  onBack,
  onSubmit,
}: Step2FormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 tab-content-enter" key="step2">
      <div>
        <Label htmlFor="bio">你在做什么 *</Label>
        <textarea
          id="bio"
          placeholder="例：独立开发AI写作工具，已上线3个月"
          maxLength={200}
          rows={2}
          className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          {...form.register('bio')}
        />
        <p className="text-xs text-mute mt-1">{form.watch('bio')?.length || 0}/200</p>
        {form.formState.errors.bio && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.bio.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="productName">产品/服务名称</Label>
        <Input
          id="productName"
          placeholder="你的产品或服务名称"
          className="mt-1.5"
          {...form.register('productName')}
        />
      </div>

      <div>
        <Label htmlFor="productTagline">简单描述你的产品或服务</Label>
        <Input
          id="productTagline"
          placeholder="你在做什么，解决谁的问题，现在到了哪个阶段"
          maxLength={300}
          className="mt-1.5"
          {...form.register('productTagline')}
        />
      </div>

      <div>
        <Label>产品阶段</Label>
        <Select
          value={form.watch('productStage') || ''}
          onValueChange={(val) => form.setValue('productStage', val)}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="选择产品阶段" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="想法阶段">想法阶段</SelectItem>
            <SelectItem value="开发中">开发中</SelectItem>
            <SelectItem value="已上线">已上线</SelectItem>
            <SelectItem value="有收入">有收入</SelectItem>
            <SelectItem value="已盈利">已盈利</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="productWebsite">产品网站</Label>
        <Input
          id="productWebsite"
          placeholder="https://"
          className="mt-1.5"
          {...form.register('productWebsite')}
        />
      </div>

      <div>
        <Label>BP / 公司介绍（选填）</Label>
        <p className="text-xs text-mute mt-0.5 mb-2">上传 BP 或公司介绍，可大幅提高推荐成功率</p>
        {bpFile ? (
          <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-surface-soft text-sm">
            <Upload className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate flex-1">{bpFile.filename}</span>
            <button
              type="button"
              onClick={() => setBpFile(null)}
              className="text-ash hover:text-mute transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
              onChange={onBpUpload}
            />
            <Button
              type="button"
              variant="outline"
              disabled={bpUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              {bpUploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />选择文件（PDF/DOC/PPT，最大 10MB）</>
              )}
            </Button>
          </div>
        )}
        {bpError && <p className="text-red-500 text-xs mt-1">{bpError}</p>}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="showInPlaza"
          checked={form.watch('showInPlaza') ?? true}
          onCheckedChange={(checked) => form.setValue('showInPlaza', checked === true)}
        />
        <Label htmlFor="showInPlaza" className="text-sm font-normal leading-snug cursor-pointer">
          同时展示在创业者广场
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="acceptInterview"
          checked={form.watch('acceptInterview')}
          onCheckedChange={(val) => form.setValue('acceptInterview', !!val)}
        />
        <div>
          <Label htmlFor="acceptInterview" className="cursor-pointer">
            愿意接受官方媒体采访或宣传报道
          </Label>
          <p className="text-xs text-mute mt-0.5">
            OPC圈会不定期推荐优质创业者故事，勾选后有机会获得曝光
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-shrink-0"
        >
          上一步
        </Button>
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? '提交中...' : '提交'}
        </Button>
      </div>
    </form>
  )
}
